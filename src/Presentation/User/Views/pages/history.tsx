import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { FileText, Calendar, Download } from 'lucide-react';

interface Summary {
    id: string;
    file_name: string;
    summary: string;
    created_at: string;
}

interface SummaryCardProps {
    summary: Summary;
    formatDate: (dateString: string) => string;
}

// 2. مكون بطاقة الملخص (SummaryCard Component)
function SummaryCard({ summary, formatDate }: SummaryCardProps) {
    const [exporting, setExporting] = useState<boolean>(false);

    // دالة تحميل الملخص كملف نصي .txt
    const downloadSummary = async () => {
        try {
            const element = document.createElement("a");
            const file = new Blob([summary.summary], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = `${summary.file_name.replace('.pdf', '')}_summary.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } catch (error) {
            console.error('Error downloading summary:', error);
        }
    };

    // دالة تصدير الملخص كملف PDF
    const exportAsPDF = async () => {
        setExporting(true);

        const exportContainer = document.createElement('div');
        exportContainer.style.position = 'absolute';
        exportContainer.style.left = '-9999px';
        exportContainer.style.top = '-9999px';
        exportContainer.style.width = '800px';
        exportContainer.style.zIndex = '9999';
        exportContainer.style.backgroundColor = '#ffffff';

        // تقسيم النص إلى فقرات HTML
        const formattedParagraphs = summary.summary
            .split('\n\n')
            .map(paragraph => `<p style="font-size: 16px; margin-bottom: 16px; margin-top: 0;">${paragraph}</p>`)
            .join('');

        exportContainer.innerHTML = `
<div style="padding: 32px; background-color: #ffffff; font-family: Arial, sans-serif;">
    <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
    <h3 style="font-size: 24px; font-weight: bold; color: #000000; margin-bottom: 8px; margin-top: 0;">Summary</h3>
<p style="font-size: 14px; color: #333333; margin: 0 0 4px 0;">${summary.file_name}</p>
<p style="font-size: 12px; color: #666666; margin: 0;">${formatDate(summary.created_at)}</p>
</div>
<div style="color: #000000; line-height: 1.75;">
    ${formattedParagraphs}
</div>
</div>
`;

        document.body.appendChild(exportContainer);

        // انتظار بسيط لضمان تعرف الـ DOM على العنصر
        await new Promise<void>(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(exportContainer, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                windowWidth: 800,
                onclone: (clonedDoc) => {
                    const styleSheets = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
                    styleSheets.forEach(sheet => sheet.remove());
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${summary.file_name.replace('.pdf', '')}_summary.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF. Please try again.');
        } finally {
            document.body.removeChild(exportContainer);
            setExporting(false);
        }
    };

    return (
        <div className="rounded-xl border border-sidebar-border bg-card p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-3 rounded-lg bg-muted flex-shrink-0">
                        <FileText className="h-6 w-6 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate" title={summary.file_name}>
                            {summary.file_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(summary.created_at)}</span>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {summary.summary}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={downloadSummary}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                        title="Download as notepad"
                        disabled={exporting}
                    >
                        <Download className="h-5 w-5 text-foreground" />
                    </button>
                    <button
                        onClick={exportAsPDF}
                        className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                        title="Export as PDF"
                        disabled={exporting}
                    >
                        <FileText className="h-5 w-5 text-foreground" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// 3. المكون الرئيسي للصفحة (History Page Component)
export default function History({ summaries }: { summaries: { data: Summary[] } }) {

    // دالة لتنسيق وعرض التاريخ بشكل منظم
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Upload History</h1>
                <p className="text-sm text-muted-foreground">View and manage your PDF summaries</p>
            </div>

            {/* التحقق من وجود بيانات داخل مصفوفة pagination لمنع انهيار الصفحة */}
            {summaries && summaries.data && summaries.data.length > 0 ? (
                <div className="grid gap-4">
                    {summaries.data.map((item) => (
                        <SummaryCard
                            key={item.id}
                            summary={item}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            ) : (
                /* واجهة عدم وجود سجلات المتطابقة تماماً مع التصميم المطلوب */
                <div className="flex flex-col items-center justify-center py-24 border border-dashed rounded-xl bg-background/50 text-center">
                    <div className="p-4 bg-muted rounded-full mb-4">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold mb-1 text-foreground">No summaries yet</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">
                        Upload your first PDF to get started
                    </p>
                    <button className="inline-flex items-center justify-center bg-foreground text-background font-medium h-10 px-6 rounded-lg hover:bg-foreground/90 transition-colors shadow-sm">
                        Upload PDF
                    </button>
                </div>
            )}
        </div>
    );
}
