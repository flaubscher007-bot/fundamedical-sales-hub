import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Trash2, Play } from 'lucide-react';

export default function SavedSearches({ onLoadSearch }) {
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      // Create a pseudo-entity for saved searches using user preferences
      const prefs = await base44.entities.UserPreference.filter({ 
        user_email: user.email 
      });
      
      if (prefs && prefs[0]?.saved_lead_searches) {
        setSavedSearches(prefs[0].saved_lead_searches || []);
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSearch = async (searchName, searchCriteria) => {
    try {
      const user = await base44.auth.me();
      const prefs = await base44.entities.UserPreference.filter({ 
        user_email: user.email 
      });

      const newSearch = {
        id: Date.now().toString(),
        name: searchName,
        criteria: searchCriteria,
        createdAt: new Date().toISOString(),
        runCount: 0
      };

      const updatedSearches = [...(prefs[0]?.saved_lead_searches || []), newSearch];
      
      if (prefs && prefs.length > 0) {
        await base44.entities.UserPreference.update(prefs[0].id, {
          saved_lead_searches: updatedSearches
        });
      }
      
      setSavedSearches(updatedSearches);
      return true;
    } catch (error) {
      console.error('Error saving search:', error);
      return false;
    }
  };

  const deleteSearch = async (searchId) => {
    try {
      const user = await base44.auth.me();
      const prefs = await base44.entities.UserPreference.filter({ 
        user_email: user.email 
      });

      const updatedSearches = savedSearches.filter(s => s.id !== searchId);
      
      if (prefs && prefs.length > 0) {
        await base44.entities.UserPreference.update(prefs[0].id, {
          saved_lead_searches: updatedSearches
        });
      }
      
      setSavedSearches(updatedSearches);
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  const handleRunSearch = (search) => {
    search.runCount = (search.runCount || 0) + 1;
    onLoadSearch(search.criteria);
  };

  if (loading) {
    return <div style={{ color: '#92F21D' }}>Loading saved searches...</div>;
  }

  return (
    <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }} className="mb-4">
      <CardHeader>
        <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
          <Bookmark className="w-5 h-5" />
          Saved Searches ({savedSearches.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {savedSearches.length === 0 ? (
          <p style={{ color: '#34CCD0' }} className="text-sm">No saved searches yet. Save your first search to get started!</p>
        ) : (
          <div className="space-y-2">
            {savedSearches.map(search => (
              <div
                key={search.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[#34CCD0] bg-[#081F3F]/50 hover:bg-[#081F3F]"
              >
                <div className="flex-1">
                  <p style={{ color: '#92F21D' }} className="font-medium">{search.name}</p>
                  <p style={{ color: '#34CCD0' }} className="text-xs">
                    Run {search.runCount || 0} times • {new Date(search.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRunSearch(search)}
                    size="sm"
                    className="bg-[#92F21D] text-[#081F3F] hover:bg-[#92F21D]/80"
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => deleteSearch(search.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}