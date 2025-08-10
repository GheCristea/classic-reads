export const SUBJECTS = [
  "Fiction",
  "Philosophy",
  "Poetry",
  "History",
  "Science",
  "Romance",
  "Adventure",
  "Mystery",
  "Children's Literature",
  "Biography",
] as const

export type Subject = (typeof SUBJECTS)[number]


