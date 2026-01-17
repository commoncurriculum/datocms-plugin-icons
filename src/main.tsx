import { connect, RenderFieldExtensionCtx } from 'datocms-plugin-sdk';
import { render } from './utils/render';
import { IconPicker } from './components/IconPicker';
import 'datocms-react-ui/styles.css';
import './index.css';

connect({
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

  renderFieldExtension(fieldExtensionId: string, ctx: RenderFieldExtensionCtx) {
    if (fieldExtensionId === 'lucideIconPicker') {
      render(<IconPicker ctx={ctx} />);
    }
  },
});
