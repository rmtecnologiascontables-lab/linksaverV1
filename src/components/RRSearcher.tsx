import { useState } from 'react';
import { Search, RotateCcw, ExternalLink, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function RRSearcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setHistory((prev) => [{ query: query.trim(), timestamp: Date.now() }, ...prev.slice(0, 9)]);
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  };

  const openInNewWindow = () => {
    if (query.trim()) {
      setHistory((prev) => [{ query: query.trim(), timestamp: Date.now() }, ...prev.slice(0, 9)]);
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto mb-4">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center bg-background border rounded-full px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="RR SEARCHER"
              className="flex-1 bg-transparent border-none outline-none px-3 text-sm"
            />
            <button
              type="button"
              onClick={openInNewWindow}
              className="p-1.5 rounded-full hover:bg-muted transition"
              title="Buscar en nueva ventana"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>RR SEARCHER - Historial</DialogTitle>
          <DialogDescription>
            Tu historial de búsquedas reciente
          </DialogDescription>
          
          <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Sin búsquedas aún</p>
                <p className="text-xs mt-1">Escribe y presiona Enter para buscar</p>
              </div>
            ) : (
              <>
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(item.query);
                      window.open(`https://www.google.com/search?q=${encodeURIComponent(item.query)}`, '_blank');
                    }}
                    className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition flex items-center justify-between"
                  >
                    <span className="truncate text-sm">{item.query}</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistory([])}
                  className="w-full mt-4 text-muted-foreground"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpiar historial
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}