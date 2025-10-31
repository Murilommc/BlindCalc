// CÓDIGO ATUALIZADO (v.5 - Funções de Raiz/Quadrado e Melhorias de Acessibilidade)

document.addEventListener('DOMContentLoaded', () => {

    const visor = document.getElementById('visor');
    const botoes = document.querySelectorAll('.botoes-grid button');
    const botaoMicrofone = document.getElementById('botao-microfone');

    let valorAtual = '0';
    let operador = null;
    let valorAnterior = null;
    let esperandoNovoNumero = false;

    function atualizarVisor() {
        // Formata números muito longos para notação científica
        if (valorAtual.length > 10 && valorAtual.includes("e")) {
             visor.textContent = parseFloat(valorAtual).toExponential(4);
        } else if (valorAtual.length > 10) {
            // Limita a exibição de decimais longos
            visor.textContent = parseFloat(valorAtual).toPrecision(7);
        } else {
            visor.textContent = valorAtual;
        }
    }

    function falar(texto) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        speechSynthesis.speak(utterance);
    }

    function lidarComClique(evento) {
        const botao = evento.target;
        if (botao.tagName !== 'BUTTON') return;
        
        const valorBotao = botao.textContent;

        if (botao.id === 'botao-microfone') {
            return;
        }

        if (!isNaN(valorBotao)) {
            if (esperandoNovoNumero || valorAtual === '0') {
                valorAtual = valorBotao;
                esperandoNovoNumero = false;
            } else {
                valorAtual += valorBotao;
            }
            falar(valorBotao);
        }
        else if (valorBotao === '.') {
            if (!valorAtual.includes('.')) {
                valorAtual += '.';
            }
            falar('ponto');
        }
        else if (valorBotao === 'C') {
            valorAtual = '0';
            operador = null;
            valorAnterior = null;
            esperandoNovoNumero = false;
            falar('limpo');
        }
        // --- ADICIONADO: Lógica para Raiz Quadrada ---
        else if (valorBotao === '√') {
            const num = parseFloat(valorAtual);
            if (num < 0) {
                valorAtual = 'Erro';
                falar('Erro, raiz de número negativo');
            } else {
                const resultado = Math.sqrt(num);
                valorAtual = String(resultado);
                falar(`raiz quadrada de ${num} igual a ${resultado}`);
            }
            esperandoNovoNumero = true; // Permite iniciar novo número após operação
        }
        // --- ADICIONADO: Lógica para Elevar ao Quadrado ---
        else if (valorBotao === 'x²') {
            const num = parseFloat(valorAtual);
            const resultado = num * num;
            valorAtual = String(resultado);
            falar(`${num} ao quadrado igual a ${resultado}`);
            esperandoNovoNumero = true; // Permite iniciar novo número após operação
        }
        else if (valorBotao === '=') {
            if (operador && valorAnterior !== null) {
                const resultado = calcular();
                valorAtual = String(resultado);
                falar(`igual a ${resultado}`);
                operador = null;
                valorAnterior = null;
            }
        }
        else { 
            // Botões de operação (+, -, *, /)
            if (operador && !esperandoNovoNumero) {
                const resultado = calcular();
                valorAtual = String(resultado);
                falar(`igual a ${resultado}`);
            }
            valorAnterior = valorAtual;
            operador = valorBotao;
            esperandoNovoNumero = true;

            let textoParaFalar = operador;
            if (operador === '*') {
                textoParaFalar = 'vezes';
            } else if (operador === '/') {
                textoParaFalar = 'dividido por';
            }
            falar(textoParaFalar);
        }

        atualizarVisor();
    }

    function calcular() {
        const anterior = parseFloat(valorAnterior);
        const atual = parseFloat(valorAtual);
        if (isNaN(anterior) || isNaN(atual)) return atual;

        switch (operador) {
            case '+': return anterior + atual;
            case '-': return anterior - atual;
            case '*': return anterior * atual;
            case '/': 
                if (atual === 0) {
                    falar('Erro, divisão por zero');
                    return 'Erro';
                }
                return anterior / atual;
            default: return atual;
        }
    }

    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        botaoMicrofone.addEventListener('click', () => {
            falar('Ouvindo');
            // --- ADICIONADO: Feedback visual e de acessibilidade ---
            botaoMicrofone.classList.add('ouvindo');
            botaoMicrofone.setAttribute('aria-label', 'Ouvindo... Pare de falar para processar.');
            recognition.start();
        });

        // --- ADICIONADO: Limpa o feedback quando a escuta termina ---
        recognition.onend = () => {
            botaoMicrofone.classList.remove('ouvindo');
            botaoMicrofone.setAttribute('aria-label', 'Gravar comando de voz');
        };

        recognition.onresult = (evento) => {
            const transcricao = evento.results[0][0].transcript;
            console.log("O navegador ouviu:", transcricao); 
            processarComandoDeVoz(transcricao);
        };

        recognition.onerror = (evento) => {
            falar('Não entendi, por favor tente novamente.');
            console.error('Speech recognition error:', evento.error);
        };
    } else {
        botaoMicrofone.style.display = 'none';
    }

    function processarComandoDeVoz(comando) {
        try {
            let comandoFalado = comando.toLowerCase().replace(/x/g, 'vezes');

            let expressao = comando.toLowerCase()
                // --- PARTE MODIFICADA ---
                // 1. Tratar "ao quadrado" e "raiz" ANTES de tratar decimais/milhares
                //    Isso preserva a vírgula do português para estas operações
                .replace(/(\d+),(\d+) ao quadrado/g, '($1.$2**2)') // "5,2 ao quadrado"
                .replace(/(\d+) ao quadrado/g, '($1**2)') // "5 ao quadrado"
                .replace(/raiz de (\d+),(\d+)/g, 'Math.sqrt($1.$2)') // "raiz de 5,2"
                .replace(/raiz de (\d+)/g, 'Math.sqrt($1)') // "raiz de 5"
                
                // 2. Correção do bug de milhar (do código original)
                .replace(/\./g, '') // Remove todos os pontos de milhar (10.000 -> 10000)
                .replace(/,/g, '.') // Troca a vírgula de decimal pelo ponto (2,5 -> 2.5)

                // 3. Substituir operadores de texto
                .replace(/mais/g, '+')
                .replace(/menos/g, '-')
                .replace(/vezes/g, '*')
                .replace(/multiplicado por/g, '*')
                .replace(/x/g, '*')
                .replace(/dividido por/g, '/')
                .replace(/ /g, '');

            // --- SUBSTITUÍDO: eval() por new Function() para mais segurança ---
            const resultado = new Function('return ' + expressao)();

            if (isNaN(resultado) || !isFinite(resultado)) {
                 throw new Error('Cálculo inválido');
            }
            
            valorAtual = String(resultado);
            falar(`Entendido. ${comandoFalado}, igual a ${resultado}`);
            atualizarVisor();

        } catch (error) {
            falar('Não consegui entender. Tente novamente.');
            console.error('Voice command processing error:', error, "Expressão tentada:", expressao);
        }
    }

    const gridBotoes = document.querySelector('.botoes-grid');
    gridBotoes.addEventListener('click', lidarComClique);

});
