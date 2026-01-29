import type { SVGProps } from 'react';

export const TetherIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path fill="#fff" d="M20.4,11.5h-8.8v2.8h2.8v8.8h3.2v-8.8h2.8V11.5z" />
  </svg>
);
