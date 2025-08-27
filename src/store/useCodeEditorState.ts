import { create } from "zustand";
import { Monaco } from "@monaco-editor/react";
import { LANGUAGE_CONFIG } from "@/app/(home)/_constants";
import { CodeEditorState } from "@/types";
import axios from "axios";

const getInitialState = () => {

    //i.e. we are on the server side, return default value
    if(typeof window === "undefined"){
        return {
            language:"cpp",
            fontsize: 14,
            theme: "vs-dark",
        }
    }

    //if we are on the client side, get the values from localStorage
    const savedlanguage = localStorage.getItem("editor-language") || "cpp";

    return {
        language: savedlanguage,
        theme: localStorage.getItem("editor-theme") || "vs-dark",
        fontsize: Number(localStorage.getItem("editor-fontsize") || 14),
    }

}

export const useCodeEditorState = create<CodeEditorState>((set, get) => {
    const initialState = getInitialState();

    return {
        ...initialState,
        output: "",
        isRunning: false,
        editor: null,
        error: null,
        executionResult: null,

        getCode: () => get().editor?.getValue() || "",

        setEditor: (editor: Monaco) => {
            const savedCode = localStorage.getItem(`editor-code-${get().language}`)
            if (savedCode) {
                editor.setValue(savedCode);
            }
            set({ editor });
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
            // Save current code before switching language
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
            // Implement code execution logic here
            const {getCode, language} = get();
            const code = getCode();

            if(!code) {
                set({ error: "Code is empty. Please write some code to run." });
                return;
            }

            set({ isRunning: true, error: null, output: "" });

            try {
                const runTime = LANGUAGE_CONFIG[language].pistonRuntime;
                const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
                    language : runTime.language,
                    version : runTime.version,
                    files: [{content:code}]
                })

                const data = response.data;

                console.log("Data from piston",data);

                //API level error
                if(data && data.message) {
                    set({error: data.message, executionResult: {code, output: "", error: data.message}})
                    return;
                }

                //compilation error
                if(data.compile && data.compile.code !==0 ){
                    const error = data.compile.stderr || data.compile.output;
                    set({
                        error,
                        executionResult:{
                            code,
                            output:"",
                            error
                        }
                    })
                    return;
                }

                if(data.run && data.run.code !==0 ) {
                    const error = data.run.stderr ||data.run.output;
                    set({
                        error,
                        executionResult:{
                            code,
                            output:"",
                            error
                        }
                    })
                    return;
                }

                // if the compilation is successfull
                const output = data.run.output;
                set({
                    output: output.trim(),
                    error: null,
                    executionResult: {
                        code, 
                        output: output.trim(),
                        error: null
                    }
                })

            } catch (error) {
                console.log("Error running code:", error);
                set({error: "Error running code", executionResult: {code, output: "", error: "Error running code"}})
            } finally {
                set({isRunning: false});
            }

        }
    };
});

export const getExecutionResult = () => useCodeEditorState.getState().executionResult;
