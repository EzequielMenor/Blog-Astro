import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
   schema: z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.string().transform((str) => new Date(str)),
      updatedDate: z.string().optional(), 
      heroImage: z.string().optional(),
      author: z.string(),
      tags: z.array(z.string()).default([]),
   }),
});

export const collections = { blog };