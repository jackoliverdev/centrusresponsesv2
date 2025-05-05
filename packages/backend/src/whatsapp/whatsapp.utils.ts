export const splitTextIntoChunks = (
  text: string,
  numChunks: number,
  options: { preserveParagraphs: boolean } = { preserveParagraphs: true },
) => {
  // Remove any trailing whitespace
  text = text.trim();

  // Calculate target chunk size
  const targetChunkSize = Math.ceil(text.length / numChunks);

  const chunks = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    // Calculate the end position for this chunk
    let endPosition = Math.min(currentPosition + targetChunkSize, text.length);

    // If we're not at the end of the text, find a good splitting point
    if (endPosition < text.length) {
      // First try to find a paragraph break near the target position
      if (options.preserveParagraphs) {
        const paragraphBreak = text.lastIndexOf('\n\n', endPosition);
        if (
          paragraphBreak > currentPosition &&
          paragraphBreak > endPosition - targetChunkSize / 2
        ) {
          endPosition = paragraphBreak;
        }
      }

      // If no paragraph break found (or not preserving paragraphs),
      // look for the last space before the target position
      if (endPosition === currentPosition + targetChunkSize) {
        const lastSpace = text.lastIndexOf(' ', endPosition);
        if (lastSpace > currentPosition) {
          endPosition = lastSpace;
        }
      }
    }

    // Extract the chunk and trim any whitespace
    const chunk = text.slice(currentPosition, endPosition).trim();
    chunks.push(chunk);

    // Move to the next position, skipping any whitespace
    currentPosition = endPosition + 1;
    while (currentPosition < text.length && text[currentPosition] === ' ') {
      currentPosition++;
    }
  }

  return chunks;
};

export const splitMessageIntoChunks = (message: string) => {
  const TWILIO_MAX_MESSAGE_LENGTH = 1600;
  const numberOfChunks = Math.ceil(message.length / TWILIO_MAX_MESSAGE_LENGTH);
  return splitTextIntoChunks(message, numberOfChunks);
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
