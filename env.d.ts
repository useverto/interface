declare module "*.module.sass" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.md" {
  const content: string;
  export default content;
}
