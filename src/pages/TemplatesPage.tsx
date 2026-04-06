import { useState } from 'react';
import { useTemplates, useTemplateCategories, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '../hooks/useTemplates';
import type { MessageTemplate } from '../types';

export function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const { data: templates = [], isLoading } = useTemplates(selectedCategory);
  const { data: categories = [] } = useTemplateCategories();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});

  const extractVars = (text: string) => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setContent('');
    setCategory('');
    setPreviewVars({});
    setShowModal(true);
  };

  const openEdit = (t: MessageTemplate) => {
    setEditing(t);
    setName(t.name);
    setContent(t.content);
    setCategory(t.category || '');
    setPreviewVars({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, name, content, category: category || null });
    } else {
      await createMutation.mutateAsync({ name, content, category: category || undefined });
    }
    setShowModal(false);
  };

  const resolvePreview = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => previewVars[key] || `{{${key}}}`);
  };

  const currentVars = extractVars(content);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-charcoal text-right">תבניות הודעות</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">
          + תבנית חדשה
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedCategory ? 'bg-accent text-white' : 'bg-cream text-muted hover:bg-cream-dark'}`}
          >
            הכל
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCategory === cat ? 'bg-accent text-white' : 'bg-cream text-muted hover:bg-cream-dark'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Templates grid */}
      {isLoading ? (
        <p className="text-sm text-muted text-right">טוען...</p>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl">
          <p className="text-muted mb-2">אין תבניות עדיין</p>
          <p className="text-xs text-muted">צור תבנית הודעה ראשונה כדי לחסוך זמן בקמפיינים</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white border border-border rounded-xl p-4 shadow-soft hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="text-xs text-accent hover:text-accent-hover">עריכה</button>
                  <span className="text-border">|</span>
                  <button onClick={() => { if (confirm('למחוק תבנית זו?')) deleteMutation.mutate(t.id); }} className="text-xs text-red-500 hover:text-red-600">מחיקה</button>
                </div>
                {t.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-light text-accent font-medium">{t.category}</span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-charcoal mb-1 text-right">{t.name}</h3>
              <p className="text-xs text-muted text-right whitespace-pre-wrap line-clamp-4" dir="auto">{t.content}</p>
              {t.variables.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap justify-end">
                  {t.variables.map((v) => (
                    <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-mono">{`{{${v}}}`}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-charcoal mb-4 text-right">{editing ? 'עריכת תבנית' : 'תבנית חדשה'}</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1 text-right">שם</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm text-right" placeholder="שם התבנית" />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1 text-right">קטגוריה (אופציונלי)</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm text-right" placeholder="מכירות, שיווק, שירות..." list="categories" />
                <datalist id="categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1 text-right">
                  תוכן ההודעה
                  <span className="text-[10px] text-muted mr-1">(השתמש ב-{`{{שם}}`} למשתנים)</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm text-right font-mono"
                  placeholder={`שלום {{name}},\nתודה שפנית אלינו!`}
                  dir="auto"
                />
              </div>

              {/* Live preview */}
              {currentVars.length > 0 && (
                <div className="bg-cream/50 border border-border rounded-lg p-3">
                  <p className="text-xs font-medium text-muted mb-2 text-right">תצוגה מקדימה</p>
                  <div className="space-y-1.5 mb-2">
                    {currentVars.map((v) => (
                      <div key={v} className="flex items-center gap-2">
                        <input
                          value={previewVars[v] || ''}
                          onChange={(e) => setPreviewVars({ ...previewVars, [v]: e.target.value })}
                          className="flex-1 px-2 py-1 border border-border rounded text-xs text-right"
                          placeholder={v}
                        />
                        <span className="text-[10px] font-mono text-muted w-24 text-left">{`{{${v}}}`}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg p-3 text-sm whitespace-pre-wrap text-right" dir="auto">
                    {resolvePreview(content)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5 justify-start">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:bg-cream transition-colors">ביטול</button>
              <button
                onClick={handleSave}
                disabled={!name || !content || createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
