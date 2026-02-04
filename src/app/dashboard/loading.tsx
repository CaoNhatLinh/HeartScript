export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-pink-200 rounded-full animate-ping"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-pink-500 rounded-full animate-spin"></div>
            </div>
        </div>
    );
}
