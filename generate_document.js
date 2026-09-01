import fs from 'fs';
import { Resvg } from '@resvg/resvg-js';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1700" width="1200" height="1700" style="background:#ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <!-- Fundo com suave tonalidade de papel oficial -->
  <rect width="1200" height="1700" fill="#faf8f2" />
  
  <!-- Borda de segurança -->
  <g transform="translate(40, 30)">
    
    <!-- ================= CABEÇALHO ================= -->
    <g transform="translate(0, 0)">
      <!-- Brasão SP Vetorizado com Alta Definição -->
      <g transform="translate(130, 60) scale(0.7)">
        <!-- Escudo -->
        <path d="M-45,-55 C-45,-55 45,-55 45,-55 C45,-5 35,35 0,60 C-35,35 -45,-5 -45,-55 Z" fill="#b91c1c" stroke="#111" stroke-width="3" />
        <path d="M-36,-46 C-36,-46 36,-46 36,-46 C36,-5 28,28 0,48 C-28,28 -36,-5 -36,-46 Z" fill="#ffffff" stroke="#111" stroke-width="1.5" />
        <!-- Espada Central -->
        <line x1="0" y1="-40" x2="0" y2="40" stroke="#111" stroke-width="3.5" />
        <line x1="-15" y1="-25" x2="15" y2="-25" stroke="#111" stroke-width="3" />
        <circle cx="0" cy="-40" r="4" fill="#111" />
        <!-- Ramos -->
        <path d="M-45,-15 C-55,-35 -50,-50 -35,-60" fill="none" stroke="#15803d" stroke-width="3.5" />
        <path d="M45,-15 C55,-35 50,-50 35,-60" fill="none" stroke="#15803d" stroke-width="3.5" />
      </g>

      <text x="130" y="124" font-size="11.5" font-weight="bold" text-anchor="middle" fill="#000">GOVERNO DO ESTADO DE SÃO PAULO</text>
      <text x="130" y="140" font-size="11" font-weight="bold" text-anchor="middle" fill="#000">SECRETARIA DE ESTADO DA EDUCAÇÃO</text>

      <!-- Textos da Escola (Direita) -->
      <g transform="translate(280, 15)">
        <text x="240" y="20" font-size="14" font-weight="bold" text-anchor="middle" fill="#000">COORDENADORIA DE ENSINO DO INTERIOR - CEI</text>
        <text x="240" y="38" font-size="14" font-weight="bold" text-anchor="middle" fill="#000">DIRETORIA DE ENSINO CAMPINAS OESTE</text>
        <text x="240" y="58" font-size="15" font-weight="bold" text-anchor="middle" fill="#000">ESCOLA ESTADUAL ELVIRA DE PARDO MÊO MURARO</text>
        
        <text x="0" y="82" font-size="11.5" font-weight="normal" fill="#000">Ato Legal de Criação: 2034983 DOE 08/01/83 – RES. SE 48/86 DOE 11/03/86.</text>
        <text x="0" y="100" font-size="11.5" font-weight="normal" fill="#000">Endereço: Rua Vicente de Marchi, s/nº - Jd. Florence I    Cie: 047200</text>
        <text x="0" y="118" font-size="11.5" font-weight="normal" fill="#000">Município : Campinas / SP    CEP: 13059-045    Tel. (19) 3227-3424</text>
        <text x="0" y="136" font-size="11.5" font-weight="normal" fill="#000">e-mail: ee.elvira@itelefonica.com / e047200a@see.sp.gov.br</text>
      </g>

      <!-- Carimbo Circular DERCO -->
      <g transform="translate(990, 70) rotate(-6)">
        <ellipse cx="0" cy="0" rx="65" ry="46" fill="#1e3a8a" fill-opacity="0.04" stroke="#1e3a8a" stroke-width="2.5" stroke-dasharray="8 3" opacity="0.85" />
        <ellipse cx="0" cy="0" rx="58" ry="39" fill="none" stroke="#1e3a8a" stroke-width="1.2" opacity="0.85" />
        <text x="0" y="-22" font-size="7.5" font-weight="bold" text-anchor="middle" fill="#1e3a8a" opacity="0.9">EE ELVIRA DE PARDO MEO MURARO</text>
        <text x="0" y="2" font-size="16" font-weight="bold" text-anchor="middle" fill="#1e3a8a" opacity="0.95" letter-spacing="1">DERCO</text>
        <text x="0" y="20" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#1e3a8a" opacity="0.95">3227-3424</text>
      </g>
    </g>

    <!-- ================= TÍTULO ================= -->
    <g transform="translate(0, 165)">
      <rect x="0" y="0" width="1120" height="34" fill="#eae6d8" stroke="#000" stroke-width="2" />
      <text x="560" y="23" font-size="16.5" font-weight="bold" text-anchor="middle" letter-spacing="2" fill="#000">HISTÓRICO ESCOLAR – ENSINO MÉDIO</text>
    </g>

    <!-- ================= DADOS DO ALUNO ================= -->
    <g transform="translate(0, 199)">
      <rect x="0" y="0" width="1120" height="56" fill="none" stroke="#000" stroke-width="2" />
      <line x1="0" y1="28" x2="1120" y2="28" stroke="#000" stroke-width="1.2" />
      
      <line x1="590" y1="0" x2="590" y2="56" stroke="#000" stroke-width="1.2" />
      <line x1="770" y1="28" x2="770" y2="56" stroke="#000" stroke-width="1.2" />

      <!-- Linha 1 -->
      <text x="12" y="19" font-size="12.5" font-weight="bold" fill="#000">Nome do Aluno:</text>
      <text x="145" y="19" font-size="13.5" font-weight="bold" fill="#000">Eder Rodrigo Tagliari</text>
      
      <text x="605" y="19" font-size="12.5" font-weight="bold" fill="#000">RG/RA:</text>
      <text x="670" y="19" font-size="13" font-weight="bold" fill="#000">51.991.369-0</text>

      <!-- Linha 2 -->
      <text x="12" y="47" font-size="12" font-weight="bold" fill="#000">Nascimento</text>
      <text x="115" y="47" font-size="12" font-weight="normal" fill="#000">Município :</text>
      <text x="185" y="47" font-size="12.5" font-weight="bold" fill="#000">CAMPINAS</text>
      
      <text x="315" y="47" font-size="12" font-weight="normal" fill="#000">Estado :</text>
      <text x="370" y="47" font-size="12.5" font-weight="bold" fill="#000">SP</text>
      
      <text x="420" y="47" font-size="12" font-weight="normal" fill="#000">Data:</text>
      <text x="465" y="47" font-size="12.5" font-weight="bold" fill="#000">07/03/1980</text>

      <text x="605" y="47" font-size="12.5" font-weight="bold" fill="#000">RM: 12633</text>
    </g>

    <!-- ================= TABELA DE NOTAS ================= -->
    <g transform="translate(0, 255)">
      <rect x="0" y="0" width="1120" height="575" fill="none" stroke="#000" stroke-width="2" />

      <!-- Linhas do Cabeçalho -->
      <line x1="0" y1="52" x2="1120" y2="52" stroke="#000" stroke-width="1.5" />
      <line x1="680" y1="26" x2="1120" y2="26" stroke="#000" stroke-width="1.2" />

      <!-- Divisores de Colunas Gerais -->
      <line x1="45" y1="0" x2="45" y2="575" stroke="#000" stroke-width="1.2" />
      <line x1="175" y1="0" x2="175" y2="352" stroke="#000" stroke-width="1.2" />
      <line x1="680" y1="0" x2="680" y2="575" stroke="#000" stroke-width="1.5" />

      <!-- Colunas 2015 (1ª Série) -->
      <line x1="825" y1="0" x2="825" y2="575" stroke="#000" stroke-width="1.5" />
      <line x1="755" y1="26" x2="755" y2="575" stroke="#000" stroke-width="1" />

      <!-- Colunas 2016 (2ª Série) -->
      <line x1="970" y1="0" x2="970" y2="575" stroke="#000" stroke-width="1.5" />
      <line x1="900" y1="26" x2="900" y2="575" stroke="#000" stroke-width="1" />

      <!-- Colunas 2017 (3ª Série) -->
      <line x1="1045" y1="26" x2="1045" y2="575" stroke="#000" stroke-width="1" />

      <!-- Títulos Colunas -->
      <text x="350" y="33" font-size="13.5" font-weight="bold" text-anchor="middle" fill="#000">COMPONENTES CURRICULARES</text>

      <text x="752" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#000">2015</text>
      <text x="752" y="44" font-size="11" font-weight="bold" text-anchor="middle" fill="#000">1ª Série</text>
      <text x="717" y="50" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#555">Nota</text>
      <text x="790" y="50" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#555">C.H.</text>

      <text x="897" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#000">2016</text>
      <text x="897" y="44" font-size="11" font-weight="bold" text-anchor="middle" fill="#000">2ª Série</text>
      <text x="862" y="50" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#555">Nota</text>
      <text x="935" y="50" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#555">C.H.</text>

      <text x="1045" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#000">2017</text>
      <text x="1045" y="44" font-size="11" font-weight="bold" text-anchor="middle" fill="#000">3ª Série</text>
      <text x="1007" y="50" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#555">Nota</text>
      <text x="1082" y="50" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#555">C.H.</text>

      <!-- Rótulo Vertical Esquerda -->
      <g transform="translate(28, 310) rotate(-90)">
        <text x="0" y="0" font-size="11" font-weight="bold" text-anchor="middle" letter-spacing="1" fill="#000">BASE NACIONAL COMUM E PARTE DIVERSIFICADA</text>
      </g>

      <!-- ================= ÁREA 1: LINGUAGENS ================= -->
      <line x1="45" y1="75" x2="1120" y2="75" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="98" x2="1120" y2="98" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="121" x2="1120" y2="121" stroke="#000" stroke-width="1.2" />

      <g transform="translate(110, 87) rotate(-90)">
        <text x="0" y="0" font-size="9" font-weight="bold" text-anchor="middle" fill="#000">Linguagens Códigos e suas Tecnologias</text>
      </g>

      <text x="185" y="69" font-size="12" fill="#000">Língua Portuguesa e Literatura</text>
      <text x="717" y="69" font-size="12" text-anchor="middle" fill="#000">4,0</text>
      <text x="790" y="69" font-size="12" text-anchor="middle" fill="#000">200</text>
      <text x="862" y="69" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="935" y="69" font-size="12" text-anchor="middle" fill="#000">160</text>
      <text x="1007" y="69" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="1082" y="69" font-size="12" text-anchor="middle" fill="#000">160</text>

      <text x="185" y="92" font-size="12" fill="#000">ARTE</text>
      <text x="717" y="92" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="790" y="92" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="862" y="92" font-size="12" text-anchor="middle" fill="#000">9,0</text>
      <text x="935" y="92" font-size="12" text-anchor="middle" fill="#000">80</text>

      <text x="185" y="115" font-size="12" fill="#000">Educação Física</text>
      <text x="717" y="115" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="790" y="115" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="862" y="115" font-size="12" text-anchor="middle" fill="#000">DIS</text>
      <text x="935" y="115" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="1007" y="115" font-size="12" text-anchor="middle" fill="#000">DIS</text>
      <text x="1082" y="115" font-size="12" text-anchor="middle" fill="#000">80</text>

      <!-- ================= ÁREA 2: NATUREZA & MATEMÁTICA ================= -->
      <line x1="45" y1="144" x2="1120" y2="144" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="167" x2="1120" y2="167" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="190" x2="1120" y2="190" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="213" x2="1120" y2="213" stroke="#000" stroke-width="1.2" />

      <g transform="translate(110, 167) rotate(-90)">
        <text x="0" y="0" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#000">Ciências da Natureza e Matemática</text>
      </g>

      <text x="185" y="138" font-size="12" fill="#000">Matemática</text>
      <text x="717" y="138" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="790" y="138" font-size="12" text-anchor="middle" fill="#000">200</text>
      <text x="862" y="138" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="935" y="138" font-size="12" text-anchor="middle" fill="#000">160</text>
      <text x="1007" y="138" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="1082" y="138" font-size="12" text-anchor="middle" fill="#000">160</text>

      <text x="185" y="161" font-size="12" fill="#000">Biologia</text>
      <text x="717" y="161" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="790" y="161" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="862" y="161" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="935" y="161" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="1007" y="161" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="1082" y="161" font-size="12" text-anchor="middle" fill="#000">80</text>

      <text x="185" y="184" font-size="12" fill="#000">Física</text>
      <text x="717" y="184" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="790" y="184" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="862" y="184" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="935" y="184" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="1007" y="184" font-size="12" text-anchor="middle" fill="#000">3,0</text>
      <text x="1082" y="184" font-size="12" text-anchor="middle" fill="#000">80</text>

      <text x="185" y="207" font-size="12" fill="#000">Química</text>
      <text x="717" y="207" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="790" y="207" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="862" y="207" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="935" y="207" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="1007" y="207" font-size="12" text-anchor="middle" fill="#000">4,0</text>
      <text x="1082" y="207" font-size="12" text-anchor="middle" fill="#000">80</text>

      <!-- ================= ÁREA 3: CIÊNCIAS HUMANAS ================= -->
      <line x1="45" y1="236" x2="1120" y2="236" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="259" x2="1120" y2="259" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="282" x2="1120" y2="282" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="305" x2="1120" y2="305" stroke="#000" stroke-width="1.2" />

      <g transform="translate(110, 259) rotate(-90)">
        <text x="0" y="0" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#000">Ciências Humanas e suas Tec.</text>
      </g>

      <text x="185" y="230" font-size="12" fill="#000">História</text>
      <text x="717" y="230" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="790" y="230" font-size="12" text-anchor="middle" fill="#000">120</text>
      <text x="862" y="230" font-size="12" text-anchor="middle" fill="#000">7,0</text>
      <text x="935" y="230" font-size="12" text-anchor="middle" fill="#000">120</text>
      <text x="1007" y="230" font-size="12" text-anchor="middle" fill="#000">7,0</text>
      <text x="1082" y="230" font-size="12" text-anchor="middle" fill="#000">40</text>

      <text x="185" y="253" font-size="12" fill="#000">Geografia</text>
      <text x="717" y="253" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="790" y="253" font-size="12" text-anchor="middle" fill="#000">120</text>
      <text x="862" y="253" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="935" y="253" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="1007" y="253" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="1082" y="253" font-size="12" text-anchor="middle" fill="#000">40</text>

      <text x="185" y="276" font-size="12" fill="#000">FILOSOFIA</text>
      <text x="862" y="276" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="935" y="276" font-size="12" text-anchor="middle" fill="#000">40</text>
      <text x="1007" y="276" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="1082" y="276" font-size="12" text-anchor="middle" fill="#000">40</text>

      <text x="185" y="299" font-size="12" fill="#000">SOCIOLOGIA</text>
      <text x="862" y="299" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="935" y="299" font-size="12" text-anchor="middle" fill="#000">40</text>
      <text x="1007" y="299" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="1082" y="299" font-size="12" text-anchor="middle" fill="#000">40</text>

      <!-- Subtotal Base Comum -->
      <line x1="45" y1="328" x2="1120" y2="328" stroke="#000" stroke-width="1.5" />
      <text x="55" y="322" font-size="12" font-weight="bold" fill="#000">CARGA HORÁRIA – BASE NACIONAL COMUM</text>
      <text x="790" y="322" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#000">1040</text>
      <text x="935" y="322" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#000">1000</text>
      <text x="1082" y="322" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#000">800</text>

      <!-- ================= PARTE DIVERSIFICADA ================= -->
      <line x1="45" y1="351" x2="1120" y2="351" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="374" x2="1120" y2="374" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="397" x2="1120" y2="397" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="420" x2="1120" y2="420" stroke="#000" stroke-width="0.8" />
      <line x1="45" y1="443" x2="1120" y2="443" stroke="#000" stroke-width="1.2" />

      <text x="55" y="345" font-size="12" fill="#000">Língua Estrangeira Moderna (INGLÊS)</text>
      <text x="717" y="345" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="790" y="345" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="862" y="345" font-size="12" text-anchor="middle" fill="#000">5,0</text>
      <text x="935" y="345" font-size="12" text-anchor="middle" fill="#000">80</text>
      <text x="1007" y="345" font-size="12" text-anchor="middle" fill="#000">8,0</text>
      <text x="1082" y="345" font-size="12" text-anchor="middle" fill="#000">40</text>

      <text x="55" y="368" font-size="12" fill="#000">LINGUA PORTUGUESA - PD</text>
      <text x="1007" y="368" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="1082" y="368" font-size="12" text-anchor="middle" fill="#000">80</text>

      <text x="55" y="391" font-size="12" fill="#000">BIOLOGIA - PD</text>
      <text x="1007" y="391" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="1082" y="391" font-size="12" text-anchor="middle" fill="#000">80</text>

      <text x="55" y="414" font-size="12" fill="#000">GEOGRAFIA - PD</text>
      <text x="1007" y="414" font-size="12" text-anchor="middle" fill="#000">6,0</text>
      <text x="1082" y="414" font-size="12" text-anchor="middle" fill="#000">80</text>

      <text x="55" y="437" font-size="12" fill="#000">FILOSOFIA</text>
      <text x="717" y="437" font-size="12" text-anchor="middle" fill="#000">8,0</text>
      <text x="790" y="437" font-size="12" text-anchor="middle" fill="#000">80</text>

      <!-- Totais Finais -->
      <line x1="0" y1="466" x2="1120" y2="466" stroke="#000" stroke-width="1.2" />
      <text x="55" y="460" font-size="12" font-weight="bold" fill="#000">CARGA HORÁRIA – PARTE DIVERSIFICADA</text>
      <text x="790" y="460" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#000">160</text>
      <text x="935" y="460" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#000">80</text>
      <text x="1082" y="460" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#000">280</text>

      <text x="55" y="484" font-size="12.5" font-weight="bold" fill="#000">TOTAL DE CARGA HORÁRIA</text>
      <text x="790" y="484" font-size="13" font-weight="bold" text-anchor="middle" fill="#000">1200</text>
      <text x="935" y="484" font-size="13" font-weight="bold" text-anchor="middle" fill="#000">1080</text>
      <text x="1082" y="484" font-size="13" font-weight="bold" text-anchor="middle" fill="#000">1080</text>

      <!-- Linha de separação para estudos realizados -->
      <line x1="0" y1="492" x2="1120" y2="492" stroke="#000" stroke-width="1.8" />

      <!-- ================= ESTUDOS REALIZADOS ================= -->
      <g transform="translate(0, 492)">
        <line x1="45" y1="0" x2="45" y2="83" stroke="#000" stroke-width="1.2" />
        <g transform="translate(28, 42) rotate(-90)">
          <text x="0" y="0" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#000">ESTUDOS REALIZADOS</text>
        </g>

        <!-- Cabeçalho colunas estudos -->
        <line x1="45" y1="21" x2="1120" y2="21" stroke="#000" stroke-width="1" />
        <line x1="160" y1="0" x2="160" y2="83" stroke="#000" stroke-width="1" />
        <line x1="260" y1="0" x2="260" y2="83" stroke="#000" stroke-width="1" />
        <line x1="320" y1="0" x2="320" y2="83" stroke="#000" stroke-width="1" />
        <line x1="720" y1="0" x2="720" y2="83" stroke="#000" stroke-width="1" />
        <line x1="970" y1="0" x2="970" y2="83" stroke="#000" stroke-width="1" />

        <text x="102" y="15" font-size="11" font-weight="bold" text-anchor="middle" fill="#000">Ensino</text>
        <text x="210" y="15" font-size="11" font-weight="bold" text-anchor="middle" fill="#000">Série/Termo</text>
        <text x="290" y="15" font-size="11" font-weight="bold" text-anchor="middle" fill="#000">Ano</text>
        <text x="520" y="15" font-size="11" font-weight="bold" text-anchor="middle" fill="#000">Estabelecimento de Ensino</text>
        <text x="845" y="15" font-size="11" font-weight="bold" text-anchor="middle" fill="#000">Município</text>
        <text x="1045" y="15" font-size="11" font-weight="bold" text-anchor="middle" fill="#000">UF</text>

        <!-- Linha 1: Fundamental -->
        <line x1="45" y1="36" x2="1120" y2="36" stroke="#000" stroke-width="0.8" />
        <text x="102" y="32" font-size="11" text-anchor="middle" fill="#000">Fundamental</text>
        <text x="210" y="32" font-size="11" text-anchor="middle" fill="#000">8º</text>
        <text x="290" y="32" font-size="11" text-anchor="middle" fill="#000">2014</text>
        <text x="330" y="32" font-size="11" fill="#000">EMEF PE. LEÃO VALLERIE</text>
        <text x="845" y="32" font-size="11" text-anchor="middle" fill="#000">CAMPINAS</text>
        <text x="1045" y="32" font-size="11" text-anchor="middle" fill="#000">SP</text>

        <!-- Linha 2: Médio 1º -->
        <line x1="45" y1="51" x2="1120" y2="51" stroke="#000" stroke-width="0.8" />
        <text x="102" y="62" font-size="11" text-anchor="middle" fill="#000">Ensino Médio</text>
        <text x="210" y="47" font-size="11" text-anchor="middle" fill="#000">1º</text>
        <text x="290" y="47" font-size="11" text-anchor="middle" fill="#000">2015</text>
        <text x="330" y="47" font-size="11" fill="#000">EE ELVIRA DE PARDO M. MURARO</text>
        <text x="845" y="47" font-size="11" text-anchor="middle" fill="#000">CAMPINAS</text>
        <text x="1045" y="47" font-size="11" text-anchor="middle" fill="#000">SP</text>

        <!-- Linha 3: Médio 2º -->
        <line x1="160" y1="67" x2="1120" y2="67" stroke="#000" stroke-width="0.8" />
        <text x="210" y="63" font-size="11" text-anchor="middle" fill="#000">2º</text>
        <text x="290" y="63" font-size="11" text-anchor="middle" fill="#000">2016</text>
        <text x="330" y="63" font-size="11" fill="#000">EE ELVIRA DE PARDO M. MURARO</text>
        <text x="845" y="63" font-size="11" text-anchor="middle" fill="#000">CAMPINAS</text>
        <text x="1045" y="63" font-size="11" text-anchor="middle" fill="#000">SP</text>

        <!-- Linha 4: Médio 3º -->
        <text x="210" y="78" font-size="11" text-anchor="middle" fill="#000">3º</text>
        <text x="290" y="78" font-size="11" text-anchor="middle" fill="#000">2017</text>
        <text x="330" y="78" font-size="11" fill="#000">EE ELVIRA DE PARDO M. MURARO</text>
        <text x="845" y="78" font-size="11" text-anchor="middle" fill="#000">CAMPINAS</text>
        <text x="1045" y="78" font-size="11" text-anchor="middle" fill="#000">SP</text>
      </g>
    </g>

    <!-- ================= OBSERVAÇÕES ================= -->
    <g transform="translate(0, 840)">
      <rect x="0" y="0" width="1120" height="52" fill="none" stroke="#000" stroke-width="2" />
      <text x="12" y="19" font-size="11.5" font-weight="bold" fill="#000">OBSERVAÇÕES: 2014 - ALUNO PROMOVIDO PELO CONSELHO DE ESCOLA NA DISCIPLINA DE LINGUA PORTUGUESA</text>
      <text x="12" y="35" font-size="11" font-weight="bold" fill="#000">EM 2017 NAS DISCIPLINAS DE FÍSICA E QUIMICA CONF. ARTº 24 INCISO V ALÍNEA &quot;A&quot; DA LDB 9394/96 E ARTº 22/23</text>
      <text x="12" y="47" font-size="11" font-weight="bold" fill="#000">PARECER CEE 66/98</text>
    </g>

    <!-- ================= CERTIFICADO ================= -->
    <g transform="translate(0, 902)">
      <rect x="0" y="0" width="1120" height="96" fill="none" stroke="#000" stroke-width="2" />
      <text x="560" y="24" font-size="15.5" font-weight="bold" text-anchor="middle" letter-spacing="1.5" fill="#000">CERTIFICADO</text>
      
      <text x="560" y="52" font-size="13" text-anchor="middle" fill="#000">
        O Diretor da Escola Estadual Elvira de Pardo Mêo Muraro <tspan font-weight="bold">CERTIFICA</tspan>, nos termos do Inciso VII, Artigo 24 da Lei Federal
      </text>
      <text x="560" y="76" font-size="13" text-anchor="middle" fill="#000">
        9394/96, que o aluno <tspan font-weight="bold" font-size="13.5">Eder Rodrigo Tagliari</tspan> concluiu a 3ª série do Ensino Médio, no ano de <tspan font-weight="bold">2017</tspan>
      </text>
    </g>

    <!-- ================= DATA E CIDADE ================= -->
    <g transform="translate(0, 1012)">
      <text x="20" y="16" font-size="14" font-weight="bold" fill="#000">Campinas, 15 / 03 / 2018</text>
    </g>

    <!-- ================= ASSINATURAS E CARIMBOS FINAIS ================= -->
    <g transform="translate(0, 1045)">
      <!-- Bloco 1: GDAE (Esquerda) -->
      <g transform="translate(0, 10)">
        <rect x="0" y="0" width="280" height="52" fill="none" stroke="#000" stroke-width="1.2" />
        <text x="12" y="22" font-size="11.5" font-weight="bold" fill="#000">Nº de Concluinte GDAE:</text>
        <text x="12" y="40" font-size="11" font-weight="normal" fill="#000">Resolução SE 11 8/02</text>
      </g>

      <!-- Bloco 2: Secretário de Escola (Centro) -->
      <g transform="translate(430, 0)">
        <!-- Rubrica em tinta azul escura -->
        <path d="M-80,-15 C-50,-40 -30,5 0,-15 C25,-35 45,5 75,-20 C95,-35 40,25 -20,10 C-40,0 20,-10 70,-5" fill="none" stroke="#1d4ed8" stroke-width="2.2" opacity="0.9" />
        <text x="20" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#000">Secretário de Escola</text>
        <text x="20" y="35" font-size="12" font-style="italic" text-anchor="middle" fill="#1e3a8a" font-weight="bold">Joelma Chaves de Oliveira</text>
        <text x="20" y="50" font-size="10.5" text-anchor="middle" fill="#000">Secretário de Escola - Subst.</text>
        <text x="20" y="63" font-size="10.5" text-anchor="middle" fill="#000">RG 23.768.345-3</text>
      </g>

      <!-- Bloco 3: Diretor de Escola (Direita) -->
      <g transform="translate(860, 0)">
        <!-- Rubrica em caneta azul -->
        <path d="M-30,-25 L15,18 L-10,-12 L35,-28 M0,-12 C45,-55 25,25 65,0" fill="none" stroke="#1d4ed8" stroke-width="2.4" opacity="0.9" />
        <line x1="-80" y1="5" x2="120" y2="5" stroke="#000" stroke-width="1.2" />
        <text x="20" y="22" font-size="12" font-weight="bold" text-anchor="middle" fill="#000">Diretor de Escola</text>
        <text x="20" y="38" font-size="12" font-style="italic" text-anchor="middle" fill="#1e3a8a" font-weight="bold">Zilda Aparecida Lyra</text>
        <text x="20" y="52" font-size="10.5" text-anchor="middle" fill="#000">Diretor de Escola</text>
        <text x="20" y="65" font-size="10.5" text-anchor="middle" fill="#000">RG 14.847.788-8</text>
      </g>
    </g>

  </g>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: {
    mode: 'width',
    value: 2400 // Alta resolução para impressão e visualização nítida (300 DPI)
  }
});

const pngData = resvg.render();
const pngBuffer = pngData.asPng();

if (!fs.existsSync('./public')) fs.mkdirSync('./public');

fs.writeFileSync('./public/historico_escolar_eder_rodrigo_tagliari.png', pngBuffer);
fs.writeFileSync('./public/historico_escolar_eder_rodrigo_tagliari.svg', svg);

console.log('PNG de Altíssima Resolução gerado com sucesso em ./public/historico_escolar_eder_rodrigo_tagliari.png! Tamanho:', pngBuffer.length, 'bytes');
