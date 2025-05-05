import React, { useState } from 'react';
import { Card } from './Card';
import { MessagesChart } from './MessagesChart';
import { UsageChart } from './UsageChart';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { UsersView } from './UsersView';

type Section = {
  title: string;
  content: React.ReactNode;
};

export const DashboardMobileSection = () => {
  const [activeSection, setActiveSection] = useState(0);

  const sections: Section[] = [
    {
      title: 'Messages',
      content: <MessagesChart />,
    },
    {
      title: 'Data overview',
      content: <UsageChart />,
    },
    {
      title: 'Team Members',
      content: <UsersView />,
    },
  ];

  const nextSection = () => {
    setActiveSection((prev) => (prev + 1) % sections.length);
  };

  const prevSection = () => {
    setActiveSection((prev) => (prev - 1 + sections.length) % sections.length);
  };

  return (
    <div className="relative md:hidden">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={prevSection}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Previous section"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold">{sections[activeSection].title}</h2>
          <button 
            onClick={nextSection}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Next section"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="h-[350px] overflow-y-auto">
          {sections[activeSection].content}
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSection(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === activeSection 
                  ? 'bg-primary' 
                  : 'bg-gray-300'
              }`}
              aria-label={`Go to section ${index + 1}`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};