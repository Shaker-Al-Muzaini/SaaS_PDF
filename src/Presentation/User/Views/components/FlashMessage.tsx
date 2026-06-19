import { CheckCircle2, AlertCircle } from 'lucide-react';

interface FlashMessageProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function FlashMessage({ flash }: FlashMessageProps) {
    if (!flash?.success && !flash?.error) {
        return null;
    }

    return (
        <div className="animate-in slide-in-from-top fixed top-4 right-4 z-50 duration-500 flex flex-col gap-2">
            {flash?.success && (
                <div className="bg-green-500 rounded-xl shadow-2xl flex items-center gap-2 px-6 py-4 text-white">
                    <CheckCircle2 className="h-6 w-6" />
                    <p className="font-semibold">{flash.success}</p>
                </div>
            )}

            {flash?.error && (
                <div className="bg-red-500 rounded-xl shadow-2xl flex items-center gap-2 px-6 py-4 text-white">
                    <AlertCircle className="h-6 w-6" />
                    <p className="font-semibold">{flash.error}</p>
                </div>
            )}
        </div>
    );
}
