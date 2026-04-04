export async function executeTavilySearch(query: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error("Chave da API Tavily não configurada.");
    
    const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            api_key: apiKey,
            query: query,
            search_depth: "advanced",
            include_answer: true,
            include_raw_content: false,
            max_results: 5,
        })
    });

    if (!response.ok) {
        throw new Error(`Erro na Tavily API: ${response.status}`);
    }

    const data = await response.json();
    
    let resultText = `Resultados da Busca (Tavily) para: "${query}"\n\n`;
    if (data.answer) {
        resultText += `Resumo da IA:\n${data.answer}\n\n`;
    }
    
    if (data.results && data.results.length > 0) {
        resultText += `Fontes:\n`;
        data.results.forEach((r: any, i: number) => {
            resultText += `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Conteúdo: ${r.content}\n\n`;
        });
    } else {
        resultText += "Nenhum resultado detalhado encontrado.";
    }

    return resultText;
}
