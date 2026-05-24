import type { Env } from './env';
import type { GeneratedMemeText } from './openRouter';
import { mergeImgflipTemplates, type ImgflipTemplate, type MemeTemplate } from './memeTemplates';

interface ImgflipGetMemesResponse {
  success: boolean;
  data?: {
    memes?: ImgflipTemplate[];
  };
}

interface ImgflipCaptionResponse {
  success: boolean;
  data?: {
    url?: string;
    page_url?: string;
  };
  error_message?: string;
}

export async function getCuratedTemplates() {
  try {
    const response = await fetch('https://api.imgflip.com/get_memes', {
      headers: { accept: 'application/json' },
    });

    if (!response.ok) {
      return mergeImgflipTemplates([]);
    }

    const data = (await response.json()) as ImgflipGetMemesResponse;
    return mergeImgflipTemplates(data.data?.memes ?? []);
  } catch {
    return mergeImgflipTemplates([]);
  }
}

export async function renderMeme(env: Env, template: MemeTemplate, text: GeneratedMemeText) {
  if (!env.IMGFLIP_USERNAME || !env.IMGFLIP_PASSWORD) {
    throw new Error('IMGFLIP_USERNAME and IMGFLIP_PASSWORD are required');
  }

  const params = new URLSearchParams();
  params.set('template_id', template.id);
  params.set('username', env.IMGFLIP_USERNAME);
  params.set('password', env.IMGFLIP_PASSWORD);
  params.set('max_font_size', '46');

  const boxes = [text.text0, text.text1, text.text2, text.text3].slice(0, template.boxCount);
  boxes.forEach((boxText, index) => {
    const value = boxText.trim() || ' ';
    params.set(`text${index}`, value);
    params.set(`boxes[${index}][text]`, value);
  });

  const response = await fetch('https://api.imgflip.com/caption_image', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Imgflip render failed: ${response.status}`);
  }

  const data = (await response.json()) as ImgflipCaptionResponse;
  if (!data.success || !data.data?.url) {
    throw new Error(data.error_message ?? 'Imgflip did not return a rendered meme URL');
  }

  return data.data.url;
}
