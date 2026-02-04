'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { calculateTopicMastery, getRecommendedReviewTopics, groupTopicsByCategory } from '../utils/topicUtils';

const TopicMastery = ({ results }) => {
  const { topicMastery, recommendedTopics, groupedTopics } = useMemo(() => {
    if (!results || results.length === 0) {
      return { topicMastery: [], recommendedTopics: [], groupedTopics: {} };
    }

    const mastery = calculateTopicMastery(results);
    const recommended = getRecommendedReviewTopics(mastery);
    const grouped = groupTopicsByCategory(mastery);

    return { topicMastery: mastery, recommendedTopics: recommended, groupedTopics: grouped };
  }, [results]);

  if (topicMastery.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Topics Needing Review */}
      {recommendedTopics.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Topics Needing Review</CardTitle>
            <CardDescription className="text-orange-600">
              These topics have less than 70% mastery and should be reviewed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendedTopics.map((topic) => (
                <div key={topic.topicId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{topic.topicName}</span>
                      <span className="text-sm text-orange-700">
                        {topic.masteryPercentage.toFixed(0)}% mastery
                      </span>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${topic.masteryPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {topic.correct}/{topic.total} questions correct • {topic.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Topics by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Topic Mastery Overview</CardTitle>
          <CardDescription>Class performance breakdown by mathematical concept</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedTopics).map(([category, topics]) => (
              <div key={category}>
                <h4 className="font-semibold text-gray-700 mb-3">{category}</h4>
                <div className="grid gap-3">
                  {topics.map((topic) => {
                    const masteryColor = topic.masteryPercentage >= 80 ? 'green' :
                                        topic.masteryPercentage >= 60 ? 'yellow' : 'red';
                    const colorClasses = {
                      green: 'bg-green-100 text-green-800 border-green-200',
                      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                      red: 'bg-red-100 text-red-800 border-red-200'
                    };
                    const barClasses = {
                      green: 'bg-green-500',
                      yellow: 'bg-yellow-500',
                      red: 'bg-red-500'
                    };

                    return (
                      <div
                        key={topic.topicId}
                        className={`p-3 rounded-lg border ${colorClasses[masteryColor]}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{topic.topicName}</span>
                          <span className="text-sm font-semibold">
                            {topic.masteryPercentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-white bg-opacity-50 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full ${barClasses[masteryColor]}`}
                            style={{ width: `${topic.masteryPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs opacity-75">
                          <span>{topic.correct} correct</span>
                          <span>{topic.total - topic.correct} incorrect</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mastery Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Mastery Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {topicMastery.filter(t => t.masteryPercentage >= 80).length}
              </div>
              <div className="text-sm text-green-700">Mastered Topics</div>
              <div className="text-xs text-gray-500">≥80% correct</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {topicMastery.filter(t => t.masteryPercentage >= 60 && t.masteryPercentage < 80).length}
              </div>
              <div className="text-sm text-yellow-700">Developing</div>
              <div className="text-xs text-gray-500">60-79% correct</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {topicMastery.filter(t => t.masteryPercentage < 60).length}
              </div>
              <div className="text-sm text-red-700">Needs Review</div>
              <div className="text-xs text-gray-500">&lt;60% correct</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopicMastery;
