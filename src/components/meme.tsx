import { sendPhoto } from "@/actions/bale-api";
import { useChatStore } from "@/basketball/store/chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Download, Send } from "lucide-react";
import { InlineKeyboard } from "grammy";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Meme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

const MemeGenerator: React.FC = () => {
  const [inputs, setInputs] = useState<{ [key: string]: string[] }>({});
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const desktop = "(min-width: 768px)";

  const [generatingMeme, setGeneratingMeme] = useState<{
    [key: string]: boolean;
  }>({});
  const [generatedMemes, setGeneratedMemes] = useState<{
    [key: string]: string | null;
  }>({});
  const { userBaleInfo } = useChatStore();
  const isDesktop = useMediaQuery(desktop);

  const [sendingMeme, setSendingMeme] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    async function fetchMemes() {
      try {
        setLoading(true);
        const response = await fetch("https://api.imgflip.com/get_memes", {
          next: { revalidate: 21600 },
        });
        const data = await response.json();
        if (data.success) {
          setMemes(data.data.memes);
        } else {
          console.error("Failed to fetch memes");
        }
      } catch (error) {
        console.error("Error fetching memes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMemes();
  }, []);

  const handleInputChange = (memeId: string, index: number, value: string) => {
    setInputs((prevInputs) => ({
      ...prevInputs,
      [memeId]: prevInputs[memeId]
        ? prevInputs[memeId].map((input, i) => (i === index ? value : input))
        : Array(memes.find((m) => m.id === memeId)?.box_count || 0)
            .fill("")
            .map((input, i) => (i === index ? value : input)),
    }));
  };

  const handleSubmit = async (memeId: string) => {
    setGeneratingMeme((prev) => ({ ...prev, [memeId]: true }));

    const selectedMeme = memes.find((m) => m.id === memeId);
    if (!selectedMeme || !inputs[memeId]) return;

    const formData = new URLSearchParams();
    formData.append("template_id", memeId);
    formData.append("username", "clutchgodfrfr"); // replace with your Imgflip username
    formData.append("password", "$KzdWSUV-z6SUqD"); // replace with your Imgflip password

    inputs[memeId].forEach((text, index) => {
      formData.append(`boxes[${index}][text]`, text);
    });

    try {
      const response = await fetch("https://api.imgflip.com/caption_image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setGeneratedMemes((prevMemes) => ({
          ...prevMemes,
          [memeId]: data.data.url,
        }));
      } else {
        console.error("Failed to generate meme");
      }
    } catch (error) {
      console.error("Error generating meme:", error);
    } finally {
      setGeneratingMeme((prev) => ({ ...prev, [memeId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[9ovh]">
        <Image
          src="/images/meme-loading.jpg"
          width={200}
          height={200}
          alt="Loading..."
        />
      </div>
    );
  }

  return (
    <div className="container gap-6 pb-8 flex items-center flex-col ">
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {memes.map((item) => (
          <Dialog key={item.id}>
            <DialogTrigger asChild>
              <div>
                {generatingMeme[item.id] && (
                  <div className="absolute inset-0 flex justify-center items-center bg-black/50 rounded-xl">
                    <Image
                      src="/image/meme-loading"
                      width={50}
                      height={50}
                      alt="Generating..."
                    />
                  </div>
                )}
                <Card className="pt-4">
                  <CardContent>
                    <Image
                      className="h-2/4 w-full object-cover rounded-xl transition-all aspect-[3/4]"
                      src={item.url}
                      width={160}
                      height={160}
                      alt="Meme Poster"
                    />
                  </CardContent>
                </Card>
              </div>
            </DialogTrigger>
            <DialogContent
              className={cn(!isDesktop && "top-0 translate-y-[0%]")}
            >
              <DialogHeader>
                <DialogTitle>{item.name}</DialogTitle>
                <DialogDescription>
                  از قالب زیر برای ساخت میم استفاده کنید
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pb-4 text-center text-sm sm:pb-0 sm:text-left">
                <div>
                  {Array.from({ length: item.box_count }).map((_, index) => (
                    <Input
                      key={index}
                      type="text"
                      className="border p-2 rounded w-full mb-2"
                      placeholder={`Text for box ${index + 1}`}
                      value={inputs[item.id]?.[index] || ""}
                      onChange={(e) =>
                        handleInputChange(item.id, index, e.target.value)
                      }
                    />
                  ))}
                </div>
                <Button
                  className="pb-2 px-4 rounded w-full"
                  onClick={() => handleSubmit(item.id)}
                  disabled={generatingMeme[item.id]}
                >
                  {generatingMeme[item.id] ? "در حال ساخت..." : "ساخت میم"}
                </Button>
                {generatedMemes[item.id] && (
                  <div className="w-full max-w-md mt-6">
                    <img
                      className="h-46 object-cover rounded-xl transition-all aspect-[3/4]"
                      width={160}
                      height={160}
                      src={generatedMemes[item.id]!}
                      alt="Generated Meme"
                    />

                    <div className="flex gap-3 justify-between *:w-1/2">
                      <Button
                        type="button"
                        disabled={sendingMeme[item.id]}
                        onClick={async () => {
                          setSendingMeme((prev) => ({
                            ...prev,
                            [item.id]: true,
                          }));
                          try {
                            const memeUrl = generatedMemes[item.id]!;
                            const photo = {
                              fileData: { url: memeUrl },
                              filename: `meme-${item.id}.jpg`,
                            };
                            // const keyboard = {
                            //   inline_keyboard: [
                            //     [
                            //       {
                            //         text: "Ghibli mode",
                            //         callback_data: "ghibli-mode",
                            //       },
                            //     ],
                            //   ],
                            // };
                            await sendPhoto({
                              chatId: Number(userBaleInfo?.id) || 0,
                              inputFile: photo,
                              caption: "",
                            });
                            toast.success("میم با موفقیت ارسال شد");
                          } catch (error) {
                            console.error("Error sending meme:", error);
                            toast.error("خطا در ارسال میم");
                          } finally {
                            setSendingMeme((prev) => ({
                              ...prev,
                              [item.id]: false,
                            }));
                          }
                        }}
                        className="pb-2 px-4 rounded w-full flex gap-2 my-2"
                      >
                        <Send className="size-4" />
                        {sendingMeme[item.id]
                          ? "در حال ارسال..."
                          : "ارسال به بات"}
                      </Button>
                      <Button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              generatedMemes[item.id]!
                            );
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `meme-${item.id}.jpg`;
                            link.click();
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error("Error downloading meme:", error);
                            toast.error("خطا در دانلود میم");
                          }
                        }}
                        className="pb-2 px-4 rounded w-full my-2 flex gap-2"
                      >
                        <Download className="size-4" />
                        دانلود
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
};

export default MemeGenerator;
