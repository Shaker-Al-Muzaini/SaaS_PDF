import { Link } from '@inertiajs/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AlertCircle, CheckCircle2, Copy, Download, FileText, History } from 'lucide-react';
import { useRef, useState } from 'react';

interface SummaryModalProps {
    show: boolean;
    summary: string;
    fileName?: string;
    onClose: () => void;
    onNewUpload: () => void;
}

export default function SummaryModal({ show, summary, fileName, onClose, onNewUpload }: SummaryModalProps) {
    const [copied, setCopied] = useState(false);
    const [exporting, setExporting] = useState(false);
    const summaryRef = useRef<HTMLDivElement>(null);

    if (!show || !summary) {
        return null;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement('a');
        const file = new Blob([summary], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${fileName?.replace('.pdf', '') || 'summary'}_summary.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleExportPDF = async () => {
        if (!summaryRef.current) {
return;
}

        setExporting(true);
        const exportContainer = document.createElement('div');
        exportContainer.style.cssText = 'position:absolute;left:0;top:0;width:800px;z-index:9999;background:#fff;';
        const paragraphs = summary.split('\n\n').map(p => `<p style="font-size:16px;margin:0 0 16px 0;">${p}</p>`).join('');
        exportContainer.innerHTML = `
            <div style="padding:32px;background:#fff;font-family:Arial;">
                <h3 style="font-size:24px;font-weight:bold;color:#7c3aed;margin:0 0 16px 0;">Summary</h3>
                <p style="font-size:14px;color:#64748b;margin:0 0 24px 0;">${fileName || 'Document'}</p>
                <div style="color:#334155;line-height:1.75;">${paragraphs}</div>
            </div>`;
        document.body.appendChild(exportContainer);

        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(exportContainer, { scale: 2, backgroundColor: '#fff' });
        const imgData = canvas.toDataURL('image/png');
        const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdfDoc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdfDoc.save(`${fileName?.replace('.pdf', '') || 'summary'}_summary.pdf`);

        document.body.removeChild(exportContainer);
        setExporting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-white" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">Summary Generated!</h2>
                                <p className="text-sm text-violet-100/80">{fileName || 'Document'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                            <AlertCircle className="h-6 w-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-8 overflow-y-auto flex-1 max-h-[calc(90vh-200px)] bg-slate-50 dark:bg-slate-950">
                    <div ref={summaryRef} className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-xl font-bold text-violet-600 dark:text-violet-400 mb-4">Summary</h3>
                        {summary.split('\n\n').map((p, i) => (
                            <p key={i} className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                                {p}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-8 py-6">
                    <div className="flex flex-wrap gap-3 justify-between items-center">
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-100 text-violet-700 font-medium hover:bg-violet-200 transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" /> Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-5 w-5" /> Copy
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-100 text-indigo-700 font-medium hover:bg-indigo-200 transition-colors"
                            >
                                <Download className="h-5 w-5" /> TXT
                            </button>

                            <button
                                onClick={handleExportPDF}
                                disabled={exporting}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200 disabled:opacity-50 transition-colors"
                            >
                                <FileText className="h-5 w-5" /> {exporting ? 'Exporting...' : 'PDF'}
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onNewUpload}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:opacity-90 transition-transform active:scale-95"
                            >
                                Upload Another
                            </button>

                            <Link
                                href="/history"
                                className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-violet-600 text-violet-600 dark:text-violet-400 font-medium hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                            >
                                <History className="h-5 w-5" /> History
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
