
import { GoogleGenAI, Type } from "@google/genai";
import { FileNode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAppStructure = async (prompt: string): Promise<{ name: string; files: { path: string; content: string }[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are an expert Application Architect and Code Extractor. 
    Analyze the following input: "${prompt}". 
    
    TASK:
    1. If the input contains raw code snippets, extract them exactly and determine their appropriate file paths.
    2. If the input is a description, architect a complete professional project structure.
    3. If the input is a mix, preserve the provided code and generate the necessary supporting files (configs, scripts, tests) around it.
    
    COORDINATION:
    - Organize files into a logical directory structure (src/, lib/, tests/, config/, etc.).
    - Ensure every file has a relevant 'path' and full, functional 'content'.
    
    OUTPUT FORMAT:
    Return ONLY a valid JSON object with:
    - name: A professional project name.
    - files: An array of objects, each with { "path": "string", "content": "string" }.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the application" },
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING, description: "Full relative path of the file" },
                content: { type: Type.STRING, description: "Full code content of the file" }
              },
              required: ["path", "content"]
            }
          }
        },
        required: ["name", "files"]
      },
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text);
};

export const convertToTree = (files: { path: string; content: string }[]): FileNode[] => {
  const root: FileNode[] = [];

  files.forEach(({ path, content }) => {
    const parts = path.split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const fullPath = parts.slice(0, index + 1).join('/');
      let node = currentLevel.find(n => n.name === part);

      if (!node) {
        node = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: fullPath,
          content: isFile ? content : undefined,
          children: isFile ? undefined : []
        };
        currentLevel.push(node);
      }
      
      if (!isFile && node.children) {
        currentLevel = node.children;
      }
    });
  });

  return root;
};
