import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  LogOut,
  LayoutGrid,
  Loader2,
  ExternalLink,
  X,
  Tag,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

import { useToast } from "../components/Toast";

export default function Dashboard() {
  const { user, logout, refreshToken } = useAuth();
  const toast = useToast();

  const getScreenshotUrl = useCallback((screenshot) => {
    if (!screenshot || typeof screenshot !== "string") return null;
    if (screenshot.startsWith("data:image/")) return screenshot;

    try {
      const parsed = new URL(screenshot);
      const publicPrefix = "/storage/v1/object/public/";

      if (parsed.pathname.includes(publicPrefix)) {
        const suffix = parsed.pathname.split(publicPrefix)[1];
        if (suffix && !suffix.startsWith("screenshots/")) {
          parsed.pathname = `${publicPrefix}screenshots/${suffix}`;
          return parsed.toString();
        }
      }

      return parsed.toString();
    } catch (_err) {
      return screenshot;
    }
  }, []);

  // State
  const [activeView, setActiveView] = useState("all"); // 'all' or tagId
  const [snaps, setSnaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef(null);
  const [tags, setTags] = useState([]);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [deletingSnapId, setDeletingSnapId] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  // tagError removed - using toast notifications instead
  const [snapTags, setSnapTags] = useState({}); // { snapId: [tag objects] }
  const [showTagPicker, setShowTagPicker] = useState(null); // snapId or null

  // Fetch tags
  const fetchWithRefresh = useCallback(
    async (url, options = {}) => {
      let response = await fetch(url, options);
      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          const updatedUser = JSON.parse(
            localStorage.getItem("scrollNote_user"),
          );
          if (updatedUser) {
            const newOptions = {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${updatedUser.token}`,
              },
            };
            response = await fetch(url, newOptions);
          }
        }
      }
      return response;
    },
    [refreshToken],
  );

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetchWithRefresh(`${API_BASE_URL}/tags`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (err) {
      console.error("Failed to fetch tags:", err);
      toast("Failed to load tags. Please try again.", "error");
    }
  }, [fetchWithRefresh, toast, user.token]);

  // Fetch snaps
  const fetchSnaps = useCallback(
    async (pageNum, append = false, search = "") => {
      try {
        let url;
        if (activeView === "all") {
          url = `${API_BASE_URL}/snaps?page=${pageNum}&limit=20`;
        } else {
          url = `${API_BASE_URL}/tags/${activeView}/snaps?page=${pageNum}&limit=20`;
        }

        if (search.trim()) {
          url += `&search=${encodeURIComponent(search.trim())}`;
        }

        const response = await fetchWithRefresh(url, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await response.json();

        if (response.ok) {
          const newSnaps = data.snaps || [];
          const total = data.totalCount || 0;
          setTotalCount(total);
          if (append) {
            setSnaps((prev) => [...prev, ...newSnaps]);
          } else {
            setSnaps(newSnaps);
          }
          const loadedCount = append
            ? (pageNum - 1) * 20 + newSnaps.length
            : newSnaps.length;
          setHasMore(loadedCount < total);
        }
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        toast("Failed to load notes. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    },
    [activeView, fetchWithRefresh, toast, user.token],
  );

  // Fetch tags for a specific snap
  const fetchSnapTags = useCallback(
    async (snapId) => {
      try {
        const response = await fetchWithRefresh(
          `${API_BASE_URL}/snaps/${snapId}/tags`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setSnapTags((prev) => ({ ...prev, [snapId]: data }));
        }
      } catch (err) {
        console.error("Failed to fetch snap tags:", err);
      }
    },
    [user.token, fetchWithRefresh],
  );

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch tags once on mount (stable dependency)
  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Refetch snaps whenever view or search changes (single source of truth)
  useEffect(() => {
    setPage(1);
    setLoading(true);
    fetchSnaps(1, false, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, debouncedSearch]); // Only re-run when view or search changes, not when fetchSnaps reference changes

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSnaps(nextPage, true, debouncedSearch);
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setCreatingTag(true);

    try {
      const response = await fetch(`${API_BASE_URL}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        const createdTag = Array.isArray(data) ? data[0] : data;
        if (createdTag?.id) {
          setTags((prev) => [...prev, createdTag]);
        } else {
          await fetchTags();
        }
        setNewTagName("");
        setShowCreateTag(false);
      } else {
        toast(data.message || "Failed to create tag", "error");
      }
    } catch (err) {
      console.error("Failed to create tag:", err);
      toast("An error occurred while creating the tag", "error");
    } finally {
      setCreatingTag(false);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm("Delete this tag? It will be removed from all notes.")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.ok) {
        setTags((prev) => prev.filter((t) => t.id !== tagId));
        if (activeView === tagId) {
          setActiveView("all");
        }
        toast("Tag deleted", "success");
      } else {
        toast("Failed to delete tag", "error");
      }
    } catch (err) {
      console.error("Failed to delete tag:", err);
    }
  };

  const toggleTagOnSnap = async (snapId, tagId) => {
    const currentTags = snapTags[snapId] || [];
    const isAssigned = currentTags.some((t) => t.id === tagId);

    try {
      const url = `${API_BASE_URL}/tags/${tagId}/snaps/${snapId}`;
      const method = isAssigned ? "DELETE" : "POST";

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.ok) {
        // Refresh snap tags
        fetchSnapTags(snapId);
      }
    } catch (err) {
      console.error("Failed to toggle tag:", err);
    }
  };

  const handleDeleteSnap = async (snapId) => {
    if (!confirm("Delete this note? This action cannot be undone.")) return;

    setDeletingSnapId(snapId);

    try {
      const response = await fetchWithRefresh(`${API_BASE_URL}/snaps/${snapId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete note";
        try {
          const data = await response.json();
          errorMessage = data.message || errorMessage;
        } catch (_err) {
          // Keep the fallback message.
        }
        toast(errorMessage, "error");
        return;
      }

      setSnaps((prev) => prev.filter((snap) => snap.id !== snapId));
      setSnapTags((prev) => {
        const next = { ...prev };
        delete next[snapId];
        return next;
      });
      setSelectedNote((prev) => (prev?.id === snapId ? null : prev));
      setShowTagPicker((prev) => (prev === snapId ? null : prev));
      setPreviewImageUrl((prev) =>
        selectedNote?.id === snapId ? null : prev,
      );
      setTotalCount((prev) => Math.max(0, prev - 1));
      toast("Note deleted", "success");
    } catch (err) {
      console.error("Failed to delete note:", err);
      toast("Failed to delete note", "error");
    } finally {
      setDeletingSnapId(null);
    }
  };

  const activeTagName =
    activeView !== "all" ? tags.find((t) => t.id === activeView)?.name : null;

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

        <nav className="flex-1 space-y-2 overflow-y-auto">
          <button
            className={`w-full flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeView === "all"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveView("all")}
          >
            <LayoutGrid className="w-5 h-5 mr-3" />
            All Notes
          </button>

          <div className="pt-4 pb-2">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tags
              </span>
              <button
                onClick={() => setShowCreateTag(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Create tag"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {showCreateTag && (
              <form onSubmit={handleCreateTag} className="px-2 mb-2">
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Tag name..."
                    className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={creatingTag}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingTag ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateTag(false);
                      setNewTagName("");
                      // Error state removed
                    }}
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {/* Inline error removed - using toast notifications */}
              </form>
            )}

            <div className="space-y-1">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className={`group flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                    activeView === tag.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <button
                    className="flex items-center flex-1 text-left"
                    onClick={() => setActiveView(tag.id)}
                  >
                    <Tag className="w-4 h-4 mr-3 shrink-0" />
                    <span className="truncate">{tag.name}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTag(tag.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    title="Delete tag"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to sign out?")) logout();
            }}
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
              placeholder="Search notes, URLs, or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg pl-10 pr-4 py-2 transition-all outline-none"
            />
          </div>
          <div className="ml-4 flex items-center space-x-4">
            <button className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold hover:bg-blue-200 transition-colors uppercase">
              {user?.email?.charAt(0) || "U"}
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <h1 className="text-3xl font-extrabold capitalize text-gray-800 tracking-tight">
                {activeTagName || "All Notes"}
              </h1>
              {totalCount > 0 && (
                <span className="text-sm text-gray-500 font-medium">
                  {totalCount} note{totalCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : snaps.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No notes found.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                  {snaps.map((snap) => {
                    const hostname = (() => {
                      try {
                        return new URL(snap.url).hostname;
                      } catch (e) {
                        return snap.url;
                      }
                    })();
                    const dateStr = new Date(
                      snap.created_at,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <div
                        key={snap.id}
                        onClick={() => {
                          setSelectedNote(snap);
                          if (!snapTags[snap.id]) {
                            fetchSnapTags(snap.id);
                          }
                        }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col h-[280px]"
                      >
                        <div className="h-44 bg-gray-100 relative overflow-hidden shrink-0 border-b border-gray-100">
                          {snap.screenshot ? (
                            <img
                              src={getScreenshotUrl(snap.screenshot)}
                              alt="Capture"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <p className="text-sm font-medium text-gray-700 line-clamp-2 mb-3 leading-relaxed">
                            {snap.text}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                            <span
                              className="truncate max-w-[120px] bg-gray-100 px-2 py-1 rounded-md text-gray-600"
                              title={hostname}
                            >
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
            onClick={() => {
              setSelectedNote(null);
              setShowTagPicker(null);
            }}
          ></div>
          <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-40 flex flex-col transform transition-transform duration-300 translate-x-0 border-l border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-800">Note Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteSnap(selectedNote.id)}
                  disabled={deletingSnapId === selectedNote.id}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingSnapId === selectedNote.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
                <button
                  onClick={() => {
                    setSelectedNote(null);
                    setShowTagPicker(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {selectedNote.screenshot && (
                <div className="w-full bg-gray-100 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImageUrl(getScreenshotUrl(selectedNote.screenshot))
                    }
                    className="block w-full cursor-zoom-in"
                  >
                    <img
                      src={getScreenshotUrl(selectedNote.screenshot)}
                      alt="Full Screenshot"
                      className="w-full object-contain max-h-[30vh]"
                    />
                  </button>
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* Tags Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Tags
                    </h3>
                    <button
                      onClick={() =>
                        setShowTagPicker(
                          showTagPicker === selectedNote.id
                            ? null
                            : selectedNote.id,
                        )
                      }
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showTagPicker === selectedNote.id ? "Done" : "Edit Tags"}
                    </button>
                  </div>

                  {showTagPicker === selectedNote.id ? (
                    <div className="space-y-1 mb-3">
                      {tags.map((tag) => {
                        const isAssigned = (
                          snapTags[selectedNote.id] || []
                        ).some((t) => t.id === tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() =>
                              toggleTagOnSnap(selectedNote.id, tag.id)
                            }
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                              isAssigned
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <span>{tag.name}</span>
                            {isAssigned ? (
                              <span className="text-xs font-medium">✓</span>
                            ) : (
                              <span className="text-xs text-gray-400">+</span>
                            )}
                          </button>
                        );
                      })}
                      {tags.length === 0 && (
                        <p className="text-sm text-gray-400">
                          No tags created yet.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(snapTags[selectedNote.id] || []).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {(snapTags[selectedNote.id] || []).length === 0 && (
                        <span className="text-sm text-gray-400">No tags</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Captured Text
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedNote.text}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Personal Note
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedNote.note?.trim() || "No personal note added."}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Source
                  </h3>
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Metadata
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p>
                      Captured on:{" "}
                      {new Date(selectedNote.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close image preview"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-6xl max-h-full w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImageUrl}
              alt="Captured screenshot preview"
              className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
