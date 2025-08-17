import { Download } from "lucide-react";

const DownloadCount = ({ count }: { count: number }) => {
    return <div className="flex items-center gap-1">
        <Download className="h-3 w-3" />
        <span>{count.toLocaleString()}</span>
    </div>
}

export default DownloadCount;