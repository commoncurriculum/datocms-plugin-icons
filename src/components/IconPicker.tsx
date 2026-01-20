import { RenderFieldExtensionCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, TextInput } from 'datocms-react-ui';
import * as LucideIcons from 'lucide-react';
import { useState, useMemo, ComponentType } from 'react';

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

function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

export function IconPicker({ ctx }: Props) {
  const [search, setSearch] = useState('');
  const currentValue = ctx.formValues[ctx.fieldPath] as string | null;

  // Parse current icon name from value like "lucide:target"
  const currentIconName = currentValue?.replace('lucide:', '') || null;
  const CurrentIcon = currentIconName
    ? iconsMap[toPascalCase(currentIconName)]
    : null;

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search) return ALL_ICONS.slice(0, 100); // Show first 100 by default
    const lower = search.toLowerCase();
    return ALL_ICONS.filter((name) => name.toLowerCase().includes(lower)).slice(
      0,
      100
    );
  }, [search]);

  const selectIcon = (pascalName: string) => {
    const kebabName = toKebabCase(pascalName);
    ctx.setFieldValue(ctx.fieldPath, `lucide:${kebabName}`);
  };

  const clearIcon = () => {
    ctx.setFieldValue(ctx.fieldPath, null);
  };

  return (
    <Canvas ctx={ctx}>
      {/* Current selection - always visible */}
      <div className="current-selection">
        {CurrentIcon ? (
          <>
            <div className="selected-icon">
              <CurrentIcon size={32} />
            </div>
            <div className="selected-info">
              <strong>{currentIconName}</strong>
              <span className="selected-value">{currentValue}</span>
            </div>
            <Button buttonSize="xs" onClick={clearIcon}>
              Clear
            </Button>
          </>
        ) : (
          <span className="no-selection">No icon selected</span>
        )}
      </div>

      {/* Search */}
      <TextInput
        value={search}
        onChange={setSearch}
        placeholder="Search 1,900+ icons..."
      />

      {/* Icon grid */}
      <div className="icon-grid">
        {filteredIcons.map((name) => {
          const Icon = iconsMap[name];
          const isSelected = toPascalCase(currentIconName || '') === name;
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

      {filteredIcons.length === 100 && (
        <p className="hint">Showing first 100 results. Type to search more.</p>
      )}
    </Canvas>
  );
}
