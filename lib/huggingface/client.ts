import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Text generation
export async function generateText(model: string, inputs: string) {
  const result = await hf.textGeneration({
    model,
    inputs,
    parameters: {
      max_new_tokens: 250,
      temperature: 0.7,
      top_p: 0.95,
    },
  });

  return result.generated_text;
}

// Text classification
export async function classifyText(text: string, model: string = 'distilbert-base-uncased-finetuned-sst-2-english') {
  const result = await hf.textClassification({
    model,
    inputs: text,
  });

  return result;
}

// Named entity recognition
export async function extractEntities(text: string, model: string = 'dbmdz/bert-large-cased-finetuned-conll03-english') {
  const result = await hf.tokenClassification({
    model,
    inputs: text,
  });

  return result;
}

// Question answering
export async function answerQuestion(question: string, context: string, model: string = 'deepset/roberta-base-squad2') {
  const result = await hf.questionAnswer({
    model,
    inputs: {
      question,
      context,
    },
  });

  return result;
}

// Summarization
export async function summarizeText(text: string, model: string = 'facebook/bart-large-cnn') {
  const result = await hf.summarization({
    model,
    inputs: text,
    parameters: {
      max_length: 150,
      min_length: 30,
    },
  });

  return result.summary_text;
}

// Translation
export async function translateText(text: string, model: string = 'facebook/mbart-large-50-many-to-many-mmt') {
  const result = await hf.translation({
    model,
    inputs: text,
  });

  return result.translation_text;
}

// Image classification
export async function classifyImage(imageUrl: string, model: string = 'google/vit-base-patch16-224') {
  const result = await hf.imageClassification({
    model,
    data: await fetch(imageUrl).then((res) => res.blob()),
  });

  return result;
}

// Zero-shot classification
export async function zeroShotClassify(text: string, labels: string[], model: string = 'facebook/bart-large-mnli') {
  const result = await hf.zeroShotClassification({
    model,
    inputs: text,
    parameters: {
      candidate_labels: labels,
    },
  });

  return result;
}

// Feature extraction
export async function extractFeatures(text: string, model: string = 'sentence-transformers/all-MiniLM-L6-v2') {
  const result = await hf.featureExtraction({
    model,
    inputs: text,
  });

  return result;
}

export { hf };
