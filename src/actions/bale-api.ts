"use server";
import axios from "axios";
import { InputFile } from "grammy";

export const sendDocument = async (
  chatId: number,
  inputFile: InputFile,
  caption: string
) => {
  const formData = new FormData();
  let buffer: Buffer;

  // Check if inputFile has a URL in fileData
  if (inputFile.fileData && inputFile.fileData.url) {
    // If inputFile has a URL, fetch the buffer
    const response = await axios.get(inputFile.fileData.url, {
      responseType: "arraybuffer",
    });
    buffer = Buffer.from(response.data);
  } else {
    // Assume inputFile is a Buffer
    buffer = inputFile.fileData; // Ensure inputFile is a Buffer
  }
  const title = inputFile.filename || "document";
  formData.append("document", new Blob([buffer]), title); // Change to document
  formData.append("chat_id", chatId.toString());
  formData.append("caption", caption); // Use caption input
  const baleBotToken = process.env.BALE_BOT_TOKEN;
  const response = await fetch(
    `https://tapi.bale.ai/bot${baleBotToken}/sendDocument`, // Ensure token is set
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json(); // Get error details
    throw new Error(
      `Error sending document: ${errorResponse.message || response.statusText}`
    );
  }

  return await response.json();
};

export const sendVideo = async ({
  chatId,
  inputFile,
  fileId,
  caption,
  reply_markup,
}: {
  chatId: number;
  inputFile?: InputFile;
  fileId?: string;
  caption: string;
  reply_markup?: object;
}) => {
  const baleBotToken = process.env.BALE_BOT_TOKEN;
  const formData = new FormData();

  // Check if inputFile has a URL in fileData
  // if (inputFile.fileData && inputFile.fileData.url) {
  //   const response = await axios.get(inputFile.fileData.url, {
  //     responseType: "arraybuffer",
  //   });
  //   buffer = Buffer.from(response.data);
  // } else {
  //   buffer = inputFile.fileData;
  // }
  const video =
    fileId ?? inputFile?.fileData?.url ?? new Blob([inputFile?.fileData]);

  // Extract the title from inputFile
  const title = inputFile.filename || "video.mp4"; // Default to "video.mp4" if title is not available
  // Append data to FormData
  formData.append("chat_id", chatId.toString());
  formData.append("caption", caption);
  formData.append("video", video, title); // Use title for the video file name
  if (reply_markup) {
    formData.append("reply_markup", JSON.stringify(reply_markup));
  }

  try {
    const response = await fetch(
      `https://tapi.bale.ai/bot${baleBotToken}/sendVideo`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorResponse = await response.json(); // Get error details
      throw new Error(
        `Error sending video: ${errorResponse.message || response.statusText}`
      );
    }

    return await response.json(); // Return response data
  } catch (error) {
    console.error("Error details:", error); // Log error details
    throw new Error(`Error sending video: ${error.message}`);
  }
};

export const sendAudio = async (
  chatId: number,
  inputFile: InputFile,
  caption: string,
  performer: string
) => {
  const formData = new FormData();
  let buffer: Buffer;

  // Check if inputFile has a URL in fileData
  if (inputFile.fileData && inputFile.fileData.url) {
    // If inputFile has a URL, fetch the buffer
    const response = await axios.get(inputFile.fileData.url, {
      responseType: "arraybuffer",
    });
    buffer = Buffer.from(response.data);
  } else {
    // Assume inputFile is a Buffer
    buffer = inputFile.fileData; // Ensure inputFile is a Buffer
  }
  const title = inputFile.filename || "audio.mp3";
  formData.append("audio", new Blob([buffer]), title); // Change to audio
  formData.append("chat_id", chatId.toString());
  formData.append("caption", caption);
  formData.append("performer", performer); // Add performer
  formData.append("title", title); // Add title
  const baleBotToken = process.env.BALE_BOT_TOKEN;
  const response = await fetch(
    `https://tapi.bale.ai/bot${baleBotToken}/sendAudio`, // Ensure token is set
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json(); // Get error details
    throw new Error(
      `Error sending audio: ${errorResponse.message || response.statusText}`
    );
  }

  return await response.json();
};

export const sendPhoto = async ({
  chatId,
  inputFile,
  caption,
  fileId,
  reply_markup,
}: {
  chatId: number;
  inputFile?: InputFile;
  caption?: string;
  fileId?: string;
  reply_markup?: object;
}) => {
  const formData = new FormData();
  let buffer: Buffer;
  if (inputFile.fileData && inputFile.fileData.url) {
    // If inputFile has a URL, fetch the buffer
    const response = await axios.get(inputFile.fileData.url, {
      responseType: "arraybuffer",
    });
    buffer = Buffer.from(response.data);
  } else {
    // Assume inputFile is a Buffer
    buffer = inputFile.fileData; // Ensure inputFile is a Buffer
  }

  formData.append("photo", new Blob([buffer]), "title");

  console.log(
    "photophotophotophoto",
    reply_markup,
    JSON.stringify(reply_markup)
  );
  formData.append("chat_id", chatId.toString());
  if (caption) {
    formData.append("caption", caption); // Add caption
  }
  if (reply_markup) {
    formData.append("reply_markup", JSON.stringify(reply_markup));
  }
  const baleBotToken = process.env.BALE_BOT_TOKEN;
  const response = await fetch(
    `https://tapi.bale.ai/bot${baleBotToken}/sendPhoto`, // Ensure token is set
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json(); // Get error details
    throw new Error(
      `Error sending photo: ${errorResponse.message || response.statusText}`
    );
  }

  return await response.json();
};
