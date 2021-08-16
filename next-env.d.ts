/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next-images" />
/// <reference types="arconnect" />

declare module "*.md" {
  const content: string;
  export default content;
}
