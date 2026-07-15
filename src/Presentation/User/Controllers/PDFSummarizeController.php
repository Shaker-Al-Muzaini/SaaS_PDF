<?php

namespace Presentation\User\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PdfSummary;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;

class PDFSummarizeController extends Controller
{
    public function summarize(Request $request)
    {
        $request->validate([
            'pdf' => 'required|file|mimes:pdf|max:20480',
        ]);

        // Check if user can summarize PDF (limit check)
        $user = auth()->user();
        if (! $user->canSummarizePdf()) {
            return response()->json([
                'message' => 'You have reached your PDF limit for this month. Please upgrade your plan to continue.',
            ], 403);
        }

        try {
            $file = $request->file('pdf');
            $originalName = $file->getClientOriginalName();

            // استخراج النص من المسار المؤقت بأمان
            $parser = new Parser;
            $pdfInstance = $parser->parseFile($file->getRealPath());
            $text = $pdfInstance->getText();

            if (empty(trim($text))) {
                return response()->json([
                    'message' => 'Unable to extract text from the PDF file. It might be scanned or empty.',
                ], 422);
            }

            // حفظ الملف مؤقتاً
            $path = $file->store('pdfs');

        } catch (Exception $e) {
            Log::error('PDF Extraction/Storage failure: '.$e->getMessage());
            return response()->json([
                'message' => 'Failed to parse the PDF file. Error: ' . $e->getMessage(),
            ], 500);
        }

        // Check if API key is configured — always use config(), never env() directly
        $apiKey = config('services.openrouter.key');
        if (empty($apiKey)) {
            Log::error('OpenRouter API key is not configured in services.openrouter.key');
            if (isset($path)) {
                Storage::delete($path);
            }

            return response()->json([
                'message' => 'API configuration error. Please contact support.',
            ], 500);
        }

        // Get summary type from request
        $summaryType = $request->input('summary_type', 'default');

        $prompts = [
            'default' => 'Summarize the following text clearly and concisely in plain text format',
            'points' => 'Summarize the following text as bullet points, highlighting key information in a clear list format',
            'highlights' => 'Extract and list the key highlights and most important takeaways from the following text',
            'detailed' => 'Provide a detailed analysis and comprehensive breakdown of the following text with in-depth ',
        ];

        $userPrompt = $prompts[$summaryType] ?? $prompts['default'];

        try {
            $response = Http::timeout(90)
                ->withHeaders([
                    'Authorization' => 'Bearer '.$apiKey,
                    'HTTP-Referer' => config('app.url', 'http://localhost:8000'),
                    'X-Title' => config('app.name', 'PDF Summary SaaS'),
                    'Content-Type' => 'application/json',
                ])
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'openai/gpt-4o-mini',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a professional PDF summarizer. Provide clear, well-formatted summaries without using markdown formatting, asterisks, or special characters. Use plain text with proper paragraphs.',
                        ],
                        [
                            'role' => 'user',
                            'content' => "{$userPrompt}:\n\n{$text}",
                        ],
                    ],
                ]);

            // في حال فشل الاستجابة، جلب نص الخطأ الخام لطباعته في المتصفح ومعرفة السبب الحقيقي
            if (! $response->ok()) {
                $errorBody = $response->body();
                $statusCode = $response->status();

                Log::error('OpenRouter API error', [
                    'status' => $statusCode,
                    'body' => $errorBody,
                ]);

                if (isset($path)) Storage::delete($path);

                // استخراج رسالة الخطأ الخام المباشرة المرتجعة من سيرفرات OpenRouter
                $errorData = $response->json();
                $errorMessage = $errorData['error']['message'] ?? $errorBody ?? 'Failed to generate summary.';

                return response()->json([
                    'message' => 'OpenRouter Error: ' . $errorMessage,
                ], $statusCode >= 500 ? 502 : 422);
            }

            $data = $response->json();

            // فحص وتأمين استخراج النص بالاعتماد على الفهرس [0] والـ fallback لمنع انهيار السيرفر بخطأ 500
            if (isset($data['choices'][0]['message']['content'])) {
                $summaryText = $data['choices'][0]['message']['content'];
            } elseif (isset($data['choices']['message']['content'])) {
                $summaryText = $data['choices']['message']['content'];
            } else {
                Log::error('Unexpected API response structure', ['response' => $data]);
                if (isset($path)) Storage::delete($path);

                return response()->json([
                    'message' => 'Unexpected response structure from AI service.',
                ], 500);
            }

            // Save to database for history
            $pdfSummary = PdfSummary::create([
                'user_id'   => auth()->id(),
                'file_name' => $originalName,
                'file_size' => $file->getSize(),
                'summary'   => $summaryText,
            ]);

            $user->increment('pdf_count');

            return response()->json([
                'summary' => $summaryText,
                'id' => $pdfSummary->id,
            ]);
        } catch (Exception $e) {
            Log::error('PDF summarization error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            if (isset($path)) {
                Storage::delete($path);
            }

            return response()->json([
                'message' => 'An error occurred while processing your PDF. Please try again.',
            ], 500);
        }
    }
}
