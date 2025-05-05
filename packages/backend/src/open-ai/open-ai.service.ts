import { Injectable } from '@nestjs/common';
import OpenAI, { NotFoundError } from 'openai';
import { ResponseStreamParams } from 'openai/lib/responses/ResponseStream';
import { ChatModel } from 'openai/resources';
import { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses';

@Injectable()
export class OpenAiService {
  private readonly openai: OpenAI;
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
      project: process.env.OPENAI_PROJECT,
    });
  }

  async createResponse(
    args: ResponseCreateParamsNonStreaming,
  ) {
    return await this.openai.responses.create(args);
  }

  async createResponseAndPoll(
    args: ResponseCreateParamsNonStreaming,
  ) {
    var response = await this.openai.responses.create(args);
    var tries = 0;
    while (tries < 120) {
      if (response.status === 'completed' || response.status === 'failed' || response.status === 'incomplete') return response;
      await new Promise(resolve => setTimeout(resolve, 1000));
      response = await this.getResponse(response.id);
      tries++;
    }
    throw new Error('Response not completed');
  }

  async getResponse(id: string): Promise<OpenAI.Responses.Response> {
    return await this.openai.responses.retrieve(id, {include: ['file_search_call.results', 'message.input_image.image_url']});
  }

  async deleteResponse(id: string) {
    try {
      return await this.openai.responses.del(id);
    } catch (error) {
      if (error instanceof NotFoundError) return;
      throw error;
    }
  }

  /**
   * Stream responses from OpenAI
   */
  async streamResponse(
    args: ResponseStreamParams,
  ) {
    return await this.openai.responses.stream(args);
  }

  async createFile(file: File, purpose: 'assistants' | 'user_data' = 'assistants') {
    console.log(`Creating file with purpose:`, file, typeof file)
    return await this.openai.files.create({
      file,
      purpose,
    });
  }

  async createVectorStore(name: string) {
    return await this.openai.vectorStores.create({
      name: name,
    });
  }

  async getVectorStore(vectorStoreId: string) {
    return await this.openai.vectorStores.retrieve(vectorStoreId);
  }

  async deleteVectorStore(vectorStoreId: string) {
    return await this.openai.vectorStores.del(vectorStoreId);
  }

  async createVectorStoreFile(vectorStoreId: string, fileId: string) {
    return await this.openai.vectorStores.files.createAndPoll(
      vectorStoreId,
      { file_id: fileId },
    );
  }

  async uploadVectorStoreFile(vectorStoreId: string, file: File) {
    const { id: fileId } = await this.createFile(file);
    return await this.createVectorStoreFile(vectorStoreId, fileId);
  }

  async deleteVectorStoreFile(vectorStoreId: string, fileId: string) {
    try {
      return await this.openai.vectorStores.files.del(
        vectorStoreId,
        fileId,
      );
    } catch (error) {
      if (error instanceof NotFoundError) return;
      throw error;
    }
  }

  async switchVectorStoreFile(
    fileId: string,
    oldVectorStoreId: string,
    newVectorStoreId: string,
  ) {
    await this.deleteVectorStoreFile(oldVectorStoreId, fileId);
    return await this.createVectorStoreFile(newVectorStoreId, fileId);
  }

  async getThreadMessagesFromResponses(
    id: string,
  ) {
    return await this.openai.responses.inputItems.list(id, {include: ['file_search_call.results', 'message.input_image.image_url']});
  }

  async deleteFile(id: string) {
    return await this.openai.files.del(id);
  }

  async createTranscript({
    file,
    model,
    response_format = 'text',
    stream = false,
  }: {
    file: File;
    model: string;
    response_format?: 'text' | 'json' | 'srt' | 'verbose_json' | 'vtt';
    stream?: boolean;
  }) {
    return await this.openai.audio.transcriptions.create({
      file,
      model,
      response_format,
    });
  }

  async prompt(
    prompt: string,
    {
      model = 'gpt-4o',
      temperature = undefined,
    }: { model?: ChatModel; temperature?: number } = {},
  ) {
    const response = await this.createResponse({
      input: [{ role: 'user', content: prompt }],
      model,
      temperature,
    });
    return response.output_text;
  }

  async createSpeech(text: string) {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    return response;
  }
}

