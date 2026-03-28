import React, { useState, useEffect } from 'react';
import { Search, LogOut, LayoutGrid, Star, User, Loader2, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('notes');
  const [snaps, setSnaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, logout } = useAuth();

  const fetchSnaps = async (pageNum, append = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/snaps?page=${pageNum}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        if (append) {
          setSnaps(prev => [...prev, ...data]);
        } else {
          setSnaps(data);
        }
        if (data.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSnaps(1, false);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSnaps(nextPage, true);
  };

  const filteredSnaps = snaps.filter(snap => 
    snap.text?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    snap.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 shadow-sm z-20">
        <div className="text-2xl font-black tracking-tight mb-8 text-blue-600 flex items-center">
          <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center mr-2 text-xl shadow-inner">
            S
          </div>
          ScrollNote
        </div>
        
        <nav className="flex-1 space-y-2">
          <button 
            className={`w-full flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'notes' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('notes')}
          >
            <LayoutGrid className="w-5 h-5 mr-3" />
            All Notes
          </button>
          <button 
            className={`w-full flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'favorites' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Star className="w-5 h-5 mr-3" />
            Favorites
          </button>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-100">
          <button 
            onClick={logout}
            className="w-full flex items-center px-4 py-2.5 text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0 shrink-0">
          <div className="flex-1 max-w-xl relative group">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search notes, tags, or URLs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg pl-10 pr-4 py-2 transition-all outline-none"
            />
          </div>
          <div className="ml-4 flex items-center space-x-4">
            <button className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold hover:bg-blue-200 transition-colors uppercase">
              {user?.email?.charAt(0) || 'U'}
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-extrabold mb-8 capitalize text-gray-800 tracking-tight">{activeTab}</h1>
            
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : filteredSnaps.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No notes found.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                  {filteredSnaps.map(snap => {
                    const hostname = (() => {
                      try { return new URL(snap.url).hostname; } 
                      catch(e) { return snap.url; }
                    })();
                    const dateStr = new Date(snap.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    return (
                      <div 
                        key={snap.id} 
                        onClick={() => setSelectedNote(snap)}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col h-[280px]"
                      >
                        <div className="h-44 bg-gray-100 relative overflow-hidden shrink-0 border-b border-gray-100">
                          {snap.screenshot_url ? (
                            <img src={snap.screenshot_url} alt="Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <p className="text-sm font-medium text-gray-700 line-clamp-2 mb-3 leading-relaxed">
                            {snap.text}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                            <span className="truncate max-w-[120px] bg-gray-100 px-2 py-1 rounded-md text-gray-600" title={hostname}>
                              {hostname}
                            </span>
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasMore && !searchQuery && (
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={handleLoadMore}
                      className="px-6 py-2 bg-white border border-gray-200 rounded-lg shadow-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Side Panel for Note "Peek" */}
      {selectedNote && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity"
            onClick={() => setSelectedNote(null)}
          ></div>
          <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-40 flex flex-col transform transition-transform duration-300 translate-x-0 border-l border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-800">Note Details</h2>
              <button 
                onClick={() => setSelectedNote(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              {selectedNote.screenshot_url && (
                <div className="w-full bg-gray-100 border-b border-gray-100">
                  <a href={selectedNote.screenshot_url} target="_blank" rel="noreferrer">
                    <img 
                      src={selectedNote.screenshot_url} 
                      alt="Full Screenshot" 
                      className="w-full object-contain max-h-[30vh]" 
                    />
                  </a>
                </div>
              )}
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Captured Text</h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedNote.text}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Source</h3>
                  <a 
                    href={selectedNote.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50/50 p-3 rounded-lg border border-blue-100 transition-colors break-all"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>{selectedNote.url}</span>
                  </a>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Metadata</h3>
                  <div className="text-sm text-gray-600">
                    <p>Captured on: {new Date(selectedNote.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}