// CÓDIGO COMPLETO E FINAL (v.4 - Correção do bug de milhar)

document.addEventListener('DOMContentLoaded', () => {

    const visor = document.getElementById('visor');
    const botoes = document.querySelectorAll('.botoes-grid button');
    const botaoMicrofone = document.getElementById('botao-microfone');

    let valorAtual = '0';
    let operador = null;
    let valorAnterior = null;
    let esperandoNovoNumero = false;

    function atualizarVisor() {
        visor.textContent = valorAtual;
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
            recognition.start();
        });

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
            // --- PARTE MODIFICADA PARA CORRIGIR O BUG DE MILHAR ---
            let expressao = comando.toLowerCase()
                .replace(/\./g, '') // 1. Remove todos os pontos de milhar (10.000 -> 10000)
                .replace(/,/g, '.') // 2. Troca a vírgula de decimal pelo ponto (2,5 -> 2.5)
                .replace(/mais/g, '+')
                .replace(/menos/g, '-')
                .replace(/vezes/g, '*')
                .replace(/multiplicado por/g, '*')
                .replace(/x/g, '*')
                .replace(/dividido por/g, '/')
                .replace(/ /g, '');

            const resultado = eval(expressao);
            if (isNaN(resultado) || !isFinite(resultado)) {
                 throw new Error('Cálculo inválido');
            }

            let comandoFalado = comando.toLowerCase().replace(/x/g, 'vezes');
            
            valorAtual = String(resultado);
            falar(`Entendido. ${comandoFalado}, igual a ${resultado}`);
            atualizarVisor();

        } catch (error) {
            falar('Não consegui entender. Tente novamente.');
            console.error('Voice command processing error:', error);
        }
    }

    const gridBotoes = document.querySelector('.botoes-grid');
    gridBotoes.addEventListener('click', lidarComClique);

});
