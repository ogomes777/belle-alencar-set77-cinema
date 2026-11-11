/** User-supplied editorial studies of Billie. The catalog remains demonstrative. */
export interface BilliePortrait { src: string; width: number; height: number }
export const BELLE_APPROVED_LOOK_IMAGES: Readonly<Record<string, BilliePortrait>> = Object.freeze({
  champagne: { src:'/assets/belle/billie/billie-look-01.webp', width:941, height:1672 },
  vinho: { src:'/assets/belle/billie/billie-look-02.webp', width:941, height:1672 },
  azul: { src:'/assets/belle/billie/billie-look-03.webp', width:941, height:1672 },
  noite: { src:'/assets/belle/billie/billie-look-04.webp', width:941, height:1672 },
  oliva: { src:'/assets/belle/billie/billie-look-05.webp', width:941, height:1672 },
  'azul-claro': { src:'/assets/belle/billie/billie-look-06.webp', width:941, height:1672 },
});
