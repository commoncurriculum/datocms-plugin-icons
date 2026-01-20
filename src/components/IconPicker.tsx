import { RenderFieldExtensionCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, TextInput, SelectInput } from 'datocms-react-ui';
import * as LucideIcons from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, useRef, ComponentType } from 'react';
import { kebabCase, pascalCase } from 'change-case';

interface Props {
  ctx: RenderFieldExtensionCtx;
}

type IconComponent = ComponentType<{ size?: number }>;
const iconsMap = LucideIcons as unknown as Record<string, IconComponent>;

// Get all icon names (filter out non-icon exports)
const ALL_ICONS = Object.keys(LucideIcons).filter(
  (key) =>
    key[0] === key[0].toUpperCase() &&
    !key.endsWith('Icon') &&
    key !== 'createLucideIcon' &&
    key !== 'Icon' &&
    !key.startsWith('Lucide')
);

type CategoryData = Record<string, string[]>;

const CATEGORY_OPTIONS = [
  { label: 'All Categories', value: '' },
  { label: 'Accessibility', value: 'accessibility' },
  { label: 'Account', value: 'account' },
  { label: 'Animals', value: 'animals' },
  { label: 'Arrows', value: 'arrows' },
  { label: 'Brands', value: 'brands' },
  { label: 'Buildings', value: 'buildings' },
  { label: 'Charts', value: 'charts' },
  { label: 'Communication', value: 'communication' },
  { label: 'Connectivity', value: 'connectivity' },
  { label: 'Design', value: 'design' },
  { label: 'Development', value: 'development' },
  { label: 'Devices', value: 'devices' },
  { label: 'Emoji', value: 'emoji' },
  { label: 'Files', value: 'files' },
  { label: 'Finance', value: 'finance' },
  { label: 'Food & Beverage', value: 'food-beverage' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Home', value: 'home' },
  { label: 'Layout', value: 'layout' },
  { label: 'Mail', value: 'mail' },
  { label: 'Math', value: 'math' },
  { label: 'Medical', value: 'medical' },
  { label: 'Multimedia', value: 'multimedia' },
  { label: 'Nature', value: 'nature' },
  { label: 'Navigation', value: 'navigation' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'People', value: 'people' },
  { label: 'Photography', value: 'photography' },
  { label: 'Science', value: 'science' },
  { label: 'Security', value: 'security' },
  { label: 'Shapes', value: 'shapes' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Social', value: 'social' },
  { label: 'Sports', value: 'sports' },
  { label: 'Sustainability', value: 'sustainability' },
  { label: 'Text', value: 'text-formatting' },
  { label: 'Time', value: 'time' },
  { label: 'Tools', value: 'tools' },
  { label: 'Transportation', value: 'transportation' },
  { label: 'Travel', value: 'travel' },
  { label: 'Weather', value: 'weather' },
];

export function IconPicker({ ctx }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categoryData, setCategoryData] = useState<CategoryData>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Use a ref to store the selected value to persist across re-renders/re-mounts
  const selectedValueRef = useRef<string | null>(
    (ctx.formValues[ctx.fieldPath] as string | null) || null
  );

  // State to trigger re-renders
  const [, forceUpdate] = useState({});

  // Getter for current value
  const selectedValue = selectedValueRef.current;

  // Fetch category data
  useEffect(() => {
    fetch('https://lucide.dev/api/categories')
      .then((res) => res.json())
      .then((data) => setCategoryData(data))
      .catch(() => {});
  }, []);

  // Parse current icon name from value like "lucide:target"
  const currentIconName = selectedValue?.replace('lucide:', '') || null;
  const CurrentIcon = currentIconName
    ? iconsMap[pascalCase(currentIconName)]
    : null;

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let icons = ALL_ICONS;

    // Filter by category
    if (category && Object.keys(categoryData).length > 0) {
      icons = icons.filter((name) => {
        const kebabName = kebabCase(name);
        const categories = categoryData[kebabName] || [];
        return categories.includes(category);
      });
    }

    // Filter by search
    if (search) {
      const lower = search.toLowerCase();
      icons = icons.filter((name) => name.toLowerCase().includes(lower));
    }

    return icons;
  }, [search, category, categoryData]);

  const selectIcon = useCallback((pascalName: string) => {
    const kebabName = kebabCase(pascalName);
    const newValue = `lucide:${kebabName}`;
    selectedValueRef.current = newValue;
    ctx.setFieldValue(ctx.fieldPath, newValue);
    setIsExpanded(false);
    forceUpdate({});
  }, [ctx]);

  const clearIcon = useCallback(() => {
    selectedValueRef.current = null;
    ctx.setFieldValue(ctx.fieldPath, null);
    forceUpdate({});
  }, [ctx]);

  // Picker visible when expanded or no icon selected
  const showPicker = isExpanded || !selectedValue;

  return (
    <Canvas ctx={ctx}>
      <div className="icon-picker-root">
        {/* Current selection - always visible at top */}
        <div className="current-selection">
          {CurrentIcon ? (
            <>
              <div className="selected-icon">
                <CurrentIcon size={32} />
              </div>
              <div className="selected-info">
                <strong>{currentIconName}</strong>
                <span className="selected-value">{selectedValue}</span>
              </div>
              <div className="selection-actions">
                <Button buttonSize="xs" onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? 'Cancel' : 'Change'}
                </Button>
                <Button buttonSize="xs" buttonType="negative" onClick={clearIcon}>
                  Remove
                </Button>
              </div>
            </>
          ) : (
            <span className="no-selection">No icon selected</span>
          )}
        </div>

        {/* Picker - only shown when expanded or no icon selected */}
        {showPicker && (
          <div className="picker">
            {/* Filters - same row */}
            <div className="filters">
              <SelectInput
                id="category-select"
                name="category"
                value={{ label: CATEGORY_OPTIONS.find(o => o.value === category)?.label || 'All Categories', value: category }}
                onChange={(newValue) => setCategory(newValue?.value || '')}
                options={CATEGORY_OPTIONS}
              />
              <TextInput
                id="search-input"
                name="search"
                value={search}
                onChange={setSearch}
                placeholder="Search icons..."
              />
            </div>

            {/* Icon grid - fixed height scroll container */}
            <div className="icon-grid-container">
              {filteredIcons.map((name) => {
                const Icon = iconsMap[name];
                const isSelected = pascalCase(currentIconName || '') === name;
                return (
                  <button
                    key={name}
                    className={`icon-button ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectIcon(name)}
                    title={name}
                    type="button"
                  >
                    <Icon size={20} />
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>

            {filteredIcons.length === 0 && (
              <p className="hint">No icons found. Try a different search or category.</p>
            )}
            <p className="hint">{filteredIcons.length} icons</p>
          </div>
        )}
      </div>
    </Canvas>
  );
}
