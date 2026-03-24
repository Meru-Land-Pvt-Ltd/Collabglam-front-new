"use client"
import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function MilestoneTimeline() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const milestones = [
    {
      title: "Project Kickoff",
      date: "January 2024",
      description: "Initial planning and team assembly",
      status: "completed"
    },
    {
      title: "Design Phase",
      date: "February 2024",
      description: "Wireframes, mockups, and design system",
      status: "completed"
    },
    {
      title: "Development Sprint 1",
      date: "March 2024",
      description: "Core infrastructure and backend setup",
      status: "in-progress"
    },
    {
      title: "Feature Development",
      date: "April - May 2024",
      description: "Building key features and integrations",
      status: "upcoming"
    },
    {
      title: "Testing & QA",
      date: "June 2024",
      description: "Comprehensive testing and bug fixes",
      status: "upcoming"
    },
    {
      title: "Launch",
      date: "July 2024",
      description: "Public release and deployment",
      status: "upcoming"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-100 to-white p-8 md:p-16">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-20">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 tracking-tight">
            <span style={{ color: '#FBBF00' }}>Milestones</span>
          </h1>
        </div>
      </div>

      {/* Stats at the top */}
      <div className="max-w-4xl mx-auto mb-20 grid grid-cols-3 gap-4 md:gap-8">
        {[
          { label: 'Completed', value: '2', color: '#10b981' },
          { label: 'In Progress', value: '1', color: '#FBBF00' },
          { label: 'Upcoming', value: '3', color: '#94a3b8' }
        ].map((stat, i) => (
          <div key={i} className="text-center p-6 rounded-lg bg-white border border-slate-200 shadow-sm">
            <div 
              className="text-3xl font-bold mb-2"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-slate-600 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline Container */}
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Vertical line */}
          <div 
            className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 md:w-0.5 transform md:-translate-x-1/2"
            style={{ backgroundColor: '#FBBF00', opacity: 0.3 }}
          />

          {/* Timeline items */}
          <div className="space-y-12 md:space-y-16">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`relative group cursor-pointer transition-all duration-300 ${
                  index % 2 === 0 ? 'md:pr-1/2' : 'md:ml-1/2'
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {/* Connector dot */}
                <div className="absolute left-0 md:left-1/2 top-0 transform -translate-x-1/2 z-10">
                  <div 
                    className={`w-6 h-6 rounded-full border-4 border-white transition-all duration-300 transform ${
                      milestone.status === 'completed' 
                        ? 'bg-green-500 scale-110' 
                        : milestone.status === 'in-progress'
                        ? 'scale-110'
                        : ''
                    }`}
                    style={{ 
                      backgroundColor: milestone.status === 'completed' ? '#10b981' : 
                                     milestone.status === 'in-progress' ? '#FBBF00' : '#cbd5e1',
                      boxShadow: activeIndex === index ? `0 0 20px ${milestone.status === 'completed' ? '#10b981' : milestone.status === 'in-progress' ? '#FBBF00' : '#cbd5e1'}` : 'none'
                    }}
                  />
                </div>

                {/* Content card */}
                <div className={`ml-12 md:ml-0 ${index % 2 === 0 ? 'md:mr-auto md:w-5/12 md:pr-12' : 'md:ml-auto md:w-5/12 md:pl-12'}`}>
                  <div
                    className="relative p-6 rounded-lg border border-slate-200 transition-all duration-300 transform shadow-sm hover:shadow-lg"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: activeIndex === index ? '#FBBF00' : 'rgb(226, 232, 240)',
                      transform: activeIndex === index ? 'scale(1.05) translateY(-4px)' : 'scale(1) translateY(0)',
                      boxShadow: activeIndex === index ? `0 20px 40px rgba(251, 191, 0, 0.2)` : '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    {/* Status badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                          milestone.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : milestone.status === 'in-progress'
                            ? 'text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        style={milestone.status === 'in-progress' ? { backgroundColor: '#FBBF00/25', color: '#B8860B' } : {}}
                      >
                        {milestone.status === 'completed' && '✓ Completed'}
                        {milestone.status === 'in-progress' && '● In Progress'}
                        {milestone.status === 'upcoming' && 'Upcoming'}
                      </span>
                    </div>

                    {/* Title and date */}
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {milestone.title}
                    </h3>
                    <p 
                      className="text-sm font-semibold mb-3 transition-colors"
                      style={{ color: '#FBBF00' }}
                    >
                      {milestone.date}
                    </p>

                    {/* Description */}
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {milestone.description}
                    </p>

                    {/* Hover accent line */}
                    <div
                      className="absolute bottom-0 left-0 h-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: '#FBBF00',
                        width: activeIndex === index ? '100%' : '0%'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}