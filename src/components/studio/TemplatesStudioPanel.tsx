import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  FilePlus2,
  Home,
  KeyRound,
  Layers,
  LayoutDashboard,
  Mail,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  UserCheck,
  UserCog,
  X,
} from 'lucide-react';
import {
  PageTemplateCategory,
  READY_PAGE_TEMPLATES,
  ReadyPageTemplate,
} from '../../data/pageTemplates';

interface TemplatesStudioPanelProps {
  lang: 'en' | 'si';
  activePageName: string;
  onCreatePageFromTemplate: (tpl: ReadyPageTemplate) => void;
  onAppendTemplateToCurrentPage: (tpl: ReadyPageTemplate) => void;
  onReplaceCurrentPageWithTemplate: (tpl: ReadyPageTemplate) => void;
}

const CATEGORY_TABS: Array<{
  id: 'all' | PageTemplateCategory;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'landing', label: 'Pages' },
  { id: 'admin', label: 'Admin' },
  { id: 'auth', label: 'Login' },
  { id: 'commerce', label: 'Shop' },
];

function getTemplateIcon(id: string) {
  switch (id) {
    case 'tpl-page-homepage':
      return <Home className="w-4 h-4" />;
    case 'tpl-page-admin-panel':
      return <LayoutDashboard className="w-4 h-4" />;
    case 'tpl-page-google-login':
      return <KeyRound className="w-4 h-4" />;
    case 'tpl-page-signup':
      return <UserCheck className="w-4 h-4" />;
    case 'tpl-page-ecommerce':
      return <ShoppingBag className="w-4 h-4" />;
    case 'tpl-page-analytics':
      return <BarChart3 className="w-4 h-4" />;
    case 'tpl-page-profile':
      return <UserCog className="w-4 h-4" />;
    case 'tpl-page-contact':
      return <Mail className="w-4 h-4" />;
    case 'tpl-page-pricing':
      return <Tag className="w-4 h-4" />;
    default:
      return <Layers className="w-4 h-4" />;
  }
}

export const TemplatesStudioPanel: React.FC<TemplatesStudioPanelProps> = ({
  lang,
  activePageName,
  onCreatePageFromTemplate,
  onAppendTemplateToCurrentPage,
  onReplaceCurrentPageWithTemplate,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | PageTemplateCategory>('all');

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return READY_PAGE_TEMPLATES.filter((t) => {
      if (category !== 'all' && t.category !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.siName.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  return (
    <div className="space-y-3 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang === 'si' ? 'Page Templates' : 'Ready Templates'}</span>
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {lang === 'si'
              ? '1-Click එකෙන් සම්පූර්ණ pages add කරන්න'
              : '1-Click full pages & wired UI kits'}
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-400/30 text-[9.5px] font-bold text-indigo-300">
          {READY_PAGE_TEMPLATES.length}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            lang === 'si'
              ? 'Template සොයන්න (Admin, Login...)'
              : 'Search templates (Admin, Login...)'
          }
          className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#090B10] border border-white/10 focus:border-[#4D97FF] text-[11px] text-white placeholder-slate-500 outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="grid grid-cols-5 gap-1 bg-[#11151d] p-1 rounded-lg border border-white/[0.07]">
        {CATEGORY_TABS.map((tab) => {
          const active = category === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className={`py-1 px-1 rounded-md text-[9.5px] font-semibold transition-colors cursor-pointer truncate ${
                active
                  ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/35'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Page Context */}
      <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[10px] text-slate-400 flex items-center justify-between gap-2">
        <span className="truncate">
          Current page: <strong className="text-slate-200">{activePageName}</strong>
        </span>
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">
          No templates match &ldquo;{search}&rdquo;
        </p>
      ) : (
        <div className="space-y-2.5">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl bg-[#11151d] border border-white/[0.08] hover:border-indigo-400/40 p-2.5 space-y-2 transition-all"
            >
              <div className="flex items-start gap-2.5">
                <div
                  style={{ backgroundColor: `${tpl.accentColor}22`, borderColor: `${tpl.accentColor}55`, color: tpl.accentColor }}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                >
                  {getTemplateIcon(tpl.id)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-[11.5px] font-bold text-slate-100 truncate">
                      {lang === 'si' ? tpl.siName : tpl.name}
                    </p>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08] shrink-0">
                      {tpl.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug mt-1">
                    {lang === 'si' ? tpl.siDescription : tpl.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => onCreatePageFromTemplate(tpl)}
                  title={`Create a new "/${tpl.slug}" page using ${tpl.name}`}
                  className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <FilePlus2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {lang === 'si' ? 'අලුත් Page' : 'New Page'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onAppendTemplateToCurrentPage(tpl)}
                  title={`Add ${tpl.name} blocks to ${activePageName}`}
                  className="py-1.5 px-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {lang === 'si' ? 'මෙතනට Add' : 'Add Here'}
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => onReplaceCurrentPageWithTemplate(tpl)}
                className="w-full py-1 px-2 rounded-md bg-transparent hover:bg-white/[0.04] text-[9.5px] text-slate-400 hover:text-slate-200 text-center cursor-pointer transition-colors"
              >
                {lang === 'si'
                  ? `"${activePageName}" සම්පූර්ණයෙන්ම ${tpl.name} බවට replace කරන්න`
                  : `Replace "${activePageName}" with ${tpl.name}`}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
