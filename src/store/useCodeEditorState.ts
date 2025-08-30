import { create } from "zustand";
import type { editor } from 'monaco-editor';
import { LANGUAGE_CONFIG } from "@/app/(home)/_constants";
import { CodeEditorState } from "@/types";
import axios from "axios";

// Properly import the Monaco editor type
type IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

const getInitialState = () => {
    if (typeof window === "undefined") {
        return {
            language: "cpp",
            fontSize: 14,
            theme: "vs-dark",
        };
    }

    const savedLanguage = localStorage.getItem("editor-language") || "cpp";

    return {
        language: savedLanguage,
        theme: localStorage.getItem("editor-theme") || "vs-dark",
        fontSize: Number(localStorage.getItem("editor-fontsize") || 14),
    };
};

export const useCodeEditorState = create<CodeEditorState>((set, get) => {
    const initialState = getInitialState();

    return {
        ...initialState,
        output: "",
        isRunning: false,
        editor: null as IStandaloneCodeEditor | null,
        error: null,
        executionResult: null,

        getCode: () => get().editor?.getValue() || "",

        setEditor: (editorInstance: IStandaloneCodeEditor) => {
            const savedCode = localStorage.getItem(`editor-code-${get().language}`);
            if (savedCode) {
                editorInstance.setValue(savedCode);
            }
            set({ editor: editorInstance });
        },

        setTheme: (theme: string) => {
            localStorage.setItem("editor-theme", theme);
            set({ theme });
        },

        setFontSize: (fontSize: number) => {
            localStorage.setItem("editor-fontsize", fontSize.toString());
            set({ fontSize });
        },

        setLanguage: (language: string) => {
            const currentCode = get().editor?.getValue();
            if (currentCode) {
                localStorage.setItem(`editor-code-${get().language}`, currentCode);
            }

            localStorage.setItem("editor-language", language);
            set({
                language,
                output: "",
                error: null,
            });
        },

        runCode: async () => {
            const { getCode, language } = get();
            const code = getCode();

            if (!code) {
                set({ error: "Code is empty. Please write some code to run." });
                return;
            }

            set({ isRunning: true, error: null, output: "" });

            try {
                const runTime = LANGUAGE_CONFIG[language].pistonRuntime;
                const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
                    language: runTime.language,
                    version: runTime.version,
                    files: [{ content: code }],
                });

                const data = response.data;

                if (data?.message) {
                    set({
                        error: data.message,
                        executionResult: { code, output: "", error: data.message },
                    });
                    return;
                }

                if (data.compile?.code !== 0) {
                    const error = data.compile.stderr || data.compile.output;
                    set({
                        error,
                        executionResult: { code, output: "", error },
                    });
                    return;
                }

                if (data.run?.code !== 0) {
                    const error = data.run.stderr || data.run.output;
                    set({
                        error,
                        executionResult: { code, output: "", error },
                    });
                    return;
                }

                const output = data.run?.output || "";
                set({
                    output: output.trim(),
                    error: null,
                    executionResult: { code, output: output.trim(), error: null },
                });
            } catch (err) {
                console.error("Error running code:", err);
                set({
                    error: "Error running code",
                    executionResult: { code, output: "", error: "Error running code" },
                });
            } finally {
                set({ isRunning: false });
            }
        },
    };
});

export const getExecutionResult = () => useCodeEditorState.getState().executionResult;
