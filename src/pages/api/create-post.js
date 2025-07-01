import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Helper para generar slugs a partir de títulos
function slugify(text) {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, '-') // Reemplaza espacios con guiones
		.replace(/[^\w-]+/g, '') // Elimina caracteres no alfanuméricos
		.replace(/--+/g, '-') // Reemplaza múltiples guiones por uno solo
		.replace(/^-+/, '') // Elimina guiones al inicio
		.replace(/-+$/, ''); // Elimina guiones al final
}

// Obtener la ruta del directorio del proyecto (importante para guardar archivos)
// Esto navega desde src/pages/api/ hacia la raíz del proyecto.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../'); // Subir 3 niveles para llegar a la raíz
const postsDirectory = path.join(projectRoot, 'src', 'content', 'blog');

export async function POST({ request }) {
	try {
		const data = await request.json();
		const { title, author, description, image, tags, body } = data;

		// Validaciones básicas para asegurar que los campos esenciales no estén vacíos
		if (!title || !author || !description || !body) {
			return new Response(JSON.stringify({ message: 'Falta algun campo obligatorio: title, author, description, body' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const slug = slugify(title); // Genera un slug para el nombre del archivo
		const pubDate = new Date().toISOString(); // Fecha y hora actual en formato ISO 8601
		pubDate: '${pubDate}';

		const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
pubDate: "${pubDate}"
author: "${author.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
${image ? `image: "${image.replace(/"/g, '\\"')}"` : ''}
${tags && tags.length > 0 ? `tags: [${tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(', ')}]` : 'tags: []'}
---

${body}
`;

		const filename = `${slug}.md`; // Nombre del archivo Markdown
		const filePath = path.join(postsDirectory, filename); // Ruta completa donde se guardará

		// Crea la carpeta de posts si no existe
		await fs.mkdir(postsDirectory, { recursive: true });

		//Escribe el archivo en markdown
		await fs.writeFile(filePath, frontmatter, 'utf-8');

		// Responde con un mensaje de éxito y el slug del nuevo post
		return new Response(JSON.stringify({ message: 'Post creado exitosamente', slug: slug }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error al crear el post:', error);
		// En caso de error, responde con un mensaje de error y el estado 500
		return new Response(JSON.stringify({ message: 'Error interno del servidor al crear el post.', error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
