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

// Obtener la ruta del directorio del proyecto de forma más robusta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajuste para calcular projectRoot
// En desarrollo, __dirname es src/pages/api/. Subir 3 niveles.
// En build, __dirname puede ser algo como dist/server/. Necesitamos una ruta relativa al directorio de los posts.

// Una forma más segura de obtener la ruta absoluta a la raíz del proyecto
// (funciona tanto en dev como en build si el script está en dist/server/)
// process.cwd() obtiene el directorio de trabajo actual (donde ejecutas `node ./dist/server/entry.mjs`)
const projectRoot = process.cwd();

// Construye la ruta al directorio de posts a partir de la raíz del proyecto.
// Esto asume que src/content/blog siempre estará relativo a la raíz del proyecto,
// incluso cuando el servidor buildado se ejecute desde 'dist'.
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

		// Asegúrate de que el directorio exista. `recursive: true` creará padres si es necesario.
		await fs.mkdir(postsDirectory, { recursive: true });

		// Escribe el archivo en markdown
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
