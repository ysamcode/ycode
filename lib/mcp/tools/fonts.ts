import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAllFonts, createFont, deleteFont } from '@/lib/repositories/fontRepository';

export function registerFontTools(server: McpServer) {
  server.tool(
    'list_fonts',
    'List all fonts added to the site. Fonts can be referenced in design properties via fontFamily.',
    {},
    async () => {
      const fonts = await getAllFonts();
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(fonts.map((f) => ({
            id: f.id,
            name: f.name,
            family: f.family,
            type: f.type,
            category: f.category,
            weights: f.weights,
            variants: f.variants,
          })), null, 2),
        }],
      };
    },
  );

  server.tool(
    'add_font',
    'Add a Google Font to the site. Once added, use the family name in typography.fontFamily design property.',
    {
      name: z.string().describe('Slug-friendly name (e.g. "open-sans", "playfair-display")'),
      family: z.string().describe('Display family name (e.g. "Open Sans", "Playfair Display")'),
      category: z.string().optional().describe('Font category: "sans-serif", "serif", "display", "monospace". Defaults to "sans-serif".'),
      weights: z.array(z.string()).optional().describe('Available weights (e.g. ["400", "500", "600", "700"]). Defaults to ["400", "700"].'),
      variants: z.array(z.string()).optional().describe('Available variants (e.g. ["regular", "italic", "700"]). Defaults to ["regular"].'),
    },
    async ({ name, family, category, weights, variants }) => {
      const font = await createFont({
        name,
        family,
        type: 'google',
        category: category || 'sans-serif',
        weights: weights || ['400', '700'],
        variants: variants || ['regular'],
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            message: `Added font "${family}"`,
            font: { id: font.id, name: font.name, family: font.family },
            usage: `Set typography.fontFamily to "${family}" in layer design`,
          }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'delete_font',
    'Remove a font from the site. Layers using this font will fall back to the default font.',
    {
      font_id: z.string().describe('The font ID to delete'),
    },
    async ({ font_id }) => {
      await deleteFont(font_id);
      return {
        content: [{ type: 'text' as const, text: `Font ${font_id} deleted successfully.` }],
      };
    },
  );
}
