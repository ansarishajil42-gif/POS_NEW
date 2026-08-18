import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex items-center gap-1.5", className)}>
            <span className="flex gap-1 mr-0.5">
                <span className="h-6 w-2 rounded-full bg-[#39ff14]"></span>
                <span className="h-6 w-2 rounded-full bg-ink"></span>
            </span>
            <span className="text-xl font-extrabold tracking-tight text-ink">
                cloudynation<span className="text-[#39ff14]">pos</span>
            </span>
        </span>
    );
}
