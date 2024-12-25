let editor;

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.32.1/min/vs' }});
require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: getLanguageTemplate('python'), 
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        roundedSelection: false,
        padding: { top: 10 }
    });
});

// For API versions
function getLanguageVersion(language) {
    const versions = {
        'python': '3.10.0',
        'javascript': '18.15.0',
        'java': '15.0.2',
        'cpp': '10.2.0',
        'c': '10.2.0'
    };
    return versions[language] || '3.10.0';
}

// For code templates
function getLanguageTemplate(language) {
    const templates = {
        'c': `#include <stdio.h>\n\nint main() {\n    // Write C code here\n    printf("Hello, World!");\n    return 0;\n}`,
        'javascript': `console.log('Hello, World!');`,
        'java': `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
        'cpp': `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!";\n    return 0;\n}`,
        'python': `print('Hello, World!')`
    };
    return templates[language] || '# Write your code here';
}


function getFileName(language) {
    const fileNames = {
        'python': 'main.py',
        'javascript': 'main.js',
        'java': 'Main.java',
        'cpp': 'main.cpp',
        'c': 'main.c'
    };
    return fileNames[language] || 'main.txt';
}


document.getElementById('language').addEventListener('change', (e) => {
    const newLanguage = e.target.value;

    monaco.editor.setModelLanguage(editor.getModel(), newLanguage);

    editor.setValue(getLanguageTemplate(newLanguage));
});

async function compileAndRun() {
    const output = document.getElementById('output');
    const loading = document.getElementById('loading');
    
    loading.style.display = 'inline-block';
    output.innerHTML = 'Running...';

    const language = document.getElementById('language').value;
    const source_code = editor.getValue();

    try {
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: language,
                version: getLanguageVersion(language),
                files: [{
                    name: getFileName(language),
                    content: source_code
                }]
            })
        });

        const result = await response.json();
        console.log(result);    
        if (result.run) {
            let outputText = '';
            if (result.run.output) {
                outputText += result.run.output;
            }else if (result.run.stderr) {
                outputText += '\nErrors:\n' + result.run.stderr;
            }
            output.innerHTML = outputText || 'No output';
        } else {
            output.innerHTML = 'Compilation failed: ' + result.message;
        }
    } catch (error) {
        output.innerHTML = 'Error: ' + error.message;
    } finally {
        loading.style.display = 'none';
    }
} 