import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Santuario from './components/Santuario';
import Guardiao from './components/Guardiao';
import Relicario from './components/Relicario';
import Despertar from './components/Despertar';
import Coracao from './components/Coracao';
import Pulso from './components/Pulso';
import Comando from './components/Comando';
import BibliotecaGaia from './components/BibliotecaGaia';
import Studio from './components/Studio';
import CofreSemantico from './components/CofreSemantico';
import Arsenal from './components/Arsenal';
import Projetos from './components/Projetos';
import Cofre from './components/Cofre';
import Altar from './components/Altar';
import Forja from './components/Forja';
import JardimDosSonhos from './components/JardimDosSonhos'; // Importe o JardimDosSonhos

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('santuario'); // Estado para a aba atual

  const navigateToTab = (tab: string) => {
    setCurrentTab(tab);
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header onNavigate={navigateToTab} /> {/* Passe a função de navegação para o Header */}
        <nav className="bg-gray-800 p-4 text-white">
          <ul className="flex justify-around">
            <li><Link to="/" onClick={() => navigateToTab('santuario')} className="hover:text-green-400">Santuário</Link></li>
            <li><Link to="/guardiao" onClick={() => navigateToTab('guardiao')} className="hover:text-green-400">Portal do Guardião</Link></li>
            <li><Link to="/relicario" onClick={() => navigateToTab('relicario')} className="hover:text-green-400">Relicário</Link></li>
            <li><Link to="/despertar" onClick={() => navigateToTab('despertar')} className="hover:text-green-400">Câmara de Despertar</Link></li>
            <li><Link to="/coracao" onClick={() => navigateToTab('coracao')} className="hover:text-green-400">Coração</Link></li>
            <li><Link to="/pulso" onClick={() => navigateToTab('pulso')} className="hover:text-green-400">Comunicações</Link></li>
            <li><Link to="/comando" onClick={() => navigateToTab('comando')} className="hover:text-green-400">Sala de Comando</Link></li>
            <li><Link to="/gaia" onClick={() => navigateToTab('gaia')} className="hover:text-green-400">Biblioteca (Gaia)</Link></li>
            <li><Link to="/studio" onClick={() => navigateToTab('studio')} className="hover:text-green-400">Estúdio</Link></li>
            <li><Link to="/semantico" onClick={() => navigateToTab('semantico')} className="hover:text-green-400">Cofre Semântico</Link></li>
            <li><Link to="/arsenal" onClick={() => navigateToTab('arsenal')} className="hover:text-green-400">Arsenal</Link></li>
            <li><Link to="/projetos" onClick={() => navigateToTab('projetos')} className="hover:text-green-400">Projetos</Link></li>
            <li><Link to="/cofre" onClick={() => navigateToTab('cofre')} className="hover:text-green-400">Finanças / Cofre</Link></li>
            <li><Link to="/altar" onClick={() => navigateToTab('altar')} className="hover:text-green-400">Altar de Doações</Link></li>
            <li><Link to="/forja" onClick={() => navigateToTab('forja')} className="hover:text-green-400">Forja Criativa</Link></li>
            <li><Link to="/jardim-sonhos" onClick={() => navigateToTab('jardim-sonhos')} className="hover:text-green-400">Jardim dos Sonhos 🌙</Link></li> {/* Nova aba */}
          </ul>
        </nav>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Santuario />} />
            <Route path="/guardiao" element={<Guardiao />} />
            <Route path="/relicario" element={<Relicario />} />
            <Route path="/despertar" element={<Despertar />} />
            <Route path="/coracao" element={<Coracao />} />
            <Route path="/pulso" element={<Pulso />} />
            <Route path="/comando" element={<Comando />} />
            <Route path="/gaia" element={<BibliotecaGaia />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/semantico" element={<CofreSemantico />} />
            <Route path="/arsenal" element={<Arsenal />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/cofre" element={<Cofre />} />
            <Route path="/altar" element={<Altar />} />
            <Route path="/forja" element={<Forja />} />
            <Route path="/jardim-sonhos" element={<JardimDosSonhos />} /> {/* Nova rota */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
