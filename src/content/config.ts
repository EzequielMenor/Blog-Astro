import { defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
   type: "content",
   schema: z.object({
      title: z.string(),
      pubDate: z.date(),
      author: z.string(),
      image: z.string().optional(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
   }),
});

export const collections = {
   'blog': blogCollection,
}