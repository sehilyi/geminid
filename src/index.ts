export { name, version } from '../package.json';

import { GoslingSchema, ThemeSchema } from '@gosling-lang/gosling-schema';
export { GoslingSchema, ThemeSchema };
export type { GoslingSpec, TemplateTrackDef } from '@gosling-lang/gosling-schema';
export type { HiGlassSpec } from '@gosling-lang/higlass-schema';
export { GoslingTemplates } from './core/utils/template';
export type { Theme } from './core/utils/theme';

export { init } from './core/init';
export { compile } from './compiler/compile';
export { validateGoslingSpec } from '@gosling-lang/gosling-schema';
export { GoslingComponent } from './core/gosling-component';
export type { GoslingRef } from './core/gosling-component';
export { embed } from './core/gosling-embed';
export { getRelativeGenomicPosition } from './core/utils';
