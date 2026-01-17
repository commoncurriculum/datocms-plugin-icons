# DatoCMS Icon Picker Plugin

A custom DatoCMS field editor plugin that provides a searchable icon picker for Lucide icons.

## Why

DatoCMS `string_select` dropdowns are limited to 77 options. Lucide has 1,900+ icons. This plugin provides a searchable, visual icon picker.

## Data format

Stores a string value: `lucide:icon-name` (e.g., `lucide:target`, `lucide:calendar-check`)

This matches the existing `icon` block schema and `src/lib/icons.ts` resolver.

## Features

### MVP
- [ ] Search icons by name
- [ ] Show icon preview with name
- [ ] Click to select, stores `lucide:icon-name`
- [ ] Show currently selected icon
- [ ] Clear selection

### Nice to have
- [ ] Category filtering (arrows, media, shapes, etc.)
- [ ] Recently used icons
- [ ] Keyboard navigation
- [ ] Virtual scrolling for performance

## Tech stack

- **Framework**: React + TypeScript
- **DatoCMS SDK**: `datocms-plugin-sdk` + `datocms-react-ui`
- **Icons**: `lucide-react`
- **Build**: Vite
- **Hosting**: Cloudflare Pages

## Project structure

```
datocms-icon-picker/
├── src/
│   ├── main.tsx           # Plugin entry point
│   ├── components/
│   │   ├── IconPicker.tsx # Main picker component
│   │   ├── IconGrid.tsx   # Grid of icons
│   │   └── SearchInput.tsx
│   ├── lib/
│   │   └── icons.ts       # Icon list utilities
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml          # Cloudflare Pages config
```

## Plugin entry point

```tsx
// src/main.tsx
import { connect, RenderFieldExtensionCtx } from 'datocms-plugin-sdk';
import { render } from './utils/render';
import { IconPicker } from './components/IconPicker';
import 'datocms-react-ui/styles.css';

connect({
  // Register as a manual field editor
  manualFieldExtensions() {
    return [
      {
        id: 'lucideIconPicker',
        name: 'Lucide Icon Picker',
        type: 'editor',
        fieldTypes: ['string'],
      },
    ];
  },

  // Render the field editor
  renderFieldExtension(fieldExtensionId: string, ctx: RenderFieldExtensionCtx) {
    if (fieldExtensionId === 'lucideIconPicker') {
      render(<IconPicker ctx={ctx} />);
    }
  },
});
```

## Icon picker component

```tsx
// src/components/IconPicker.tsx
import { RenderFieldExtensionCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, TextInput } from 'datocms-react-ui';
import * as LucideIcons from 'lucide-react';
import { useState, useMemo } from 'react';

interface Props {
  ctx: RenderFieldExtensionCtx;
}

// Get all icon names (filter out non-icon exports)
const ALL_ICONS = Object.keys(LucideIcons).filter(
  (key) =>
    key[0] === key[0].toUpperCase() &&
    !key.endsWith('Icon') &&
    key !== 'createLucideIcon' &&
    key !== 'Icon' &&
    !key.startsWith('Lucide')
);

export function IconPicker({ ctx }: Props) {
  const [search, setSearch] = useState('');
  const currentValue = ctx.formValues[ctx.fieldPath] as string | null;

  // Parse current icon name from value like "lucide:target"
  const currentIconName = currentValue?.replace('lucide:', '') || null;
  const CurrentIcon = currentIconName
    ? (LucideIcons as Record<string, LucideIcons.LucideIcon>)[toPascalCase(currentIconName)]
    : null;

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search) return ALL_ICONS.slice(0, 100); // Show first 100 by default
    const lower = search.toLowerCase();
    return ALL_ICONS.filter((name) => name.toLowerCase().includes(lower)).slice(0, 100);
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
      {/* Current selection */}
      {CurrentIcon && (
        <div className="current-selection">
          <CurrentIcon size={24} />
          <span>{currentValue}</span>
          <Button buttonSize="xxs" onClick={clearIcon}>Clear</Button>
        </div>
      )}

      {/* Search */}
      <TextInput
        value={search}
        onChange={setSearch}
        placeholder="Search 1,900+ icons..."
      />

      {/* Icon grid */}
      <div className="icon-grid">
        {filteredIcons.map((name) => {
          const Icon = (LucideIcons as Record<string, LucideIcons.LucideIcon>)[name];
          const isSelected = toPascalCase(currentIconName || '') === name;
          return (
            <button
              key={name}
              className={`icon-button ${isSelected ? 'selected' : ''}`}
              onClick={() => selectIcon(name)}
              title={name}
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

function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function toPascalCase(str: string): string {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}
```

## Styles

```css
/* src/index.css */
.current-selection {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--light-bg-color);
  border-radius: 4px;
  margin-bottom: 12px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 12px;
}

.icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  font-size: 10px;
  color: var(--light-body-color);
}

.icon-button:hover {
  background: var(--light-bg-color);
  border-color: var(--border-color);
}

.icon-button.selected {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.icon-button span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hint {
  font-size: 12px;
  color: var(--light-body-color);
  margin-top: 8px;
}
```

## Setup commands

```bash
# Create project
mkdir datocms-icon-picker && cd datocms-icon-picker
pnpm init
pnpm add react react-dom datocms-plugin-sdk datocms-react-ui lucide-react
pnpm add -D typescript vite @vitejs/plugin-react @types/react @types/react-dom

# Build
pnpm build

# Deploy to Cloudflare Pages
pnpm wrangler pages deploy dist
```

## Cloudflare Pages config

```toml
# wrangler.toml
name = "datocms-icon-picker"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
```

## DatoCMS configuration

After deploying:

1. Go to DatoCMS → Settings → Plugins
2. Click "Add new private plugin"
3. Enter the Cloudflare Pages URL
4. Go to the `icon` block → `icon_name` field
5. Change appearance from `string_select` to the new plugin

## Testing locally

```bash
# Start dev server
pnpm dev

# DatoCMS needs HTTPS, use ngrok or similar
ngrok http 5173

# Add ngrok URL as private plugin for testing
```

## References

- [DatoCMS Plugin SDK docs](https://www.datocms.com/docs/plugin-sdk)
- [datocms-plugin-sdk npm](https://www.npmjs.com/package/datocms-plugin-sdk)
- [Example plugins](https://github.com/datocms/plugins)
- [Lucide icons](https://lucide.dev/icons/)
