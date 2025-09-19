import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="border-b border-border/40">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <NavLink to="/" className="text-xl font-bold text-foreground">StockEase</NavLink>
        <div className="space-x-6">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/reports" 
            className={({ isActive }) => 
              `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`
            }
          >
            Reports
          </NavLink>
        </div>
      </nav>
    </header>
  );
};

export default Header;
