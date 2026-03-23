import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getInventoryAnalytics, type InventoryAnalyticsData } from "../../api/inventoryAnalytics";
import WorkstationTimeline from "./WorkstationTimeline";
<<<<<<< HEAD
import AssetLifecycleChart from "./AssetLifecycleChart";
=======
>>>>>>> origin/jesi-branch
import { useAuth } from "../../context/AuthContext";
import { Search } from "lucide-react";

const COLORS = {
  "Functional": "#10b981",
  "For Replacement": "#f59e0b",
  "For Repair": "#3b82f6",
  "For Upgrade": "#8b5cf6",
  "Lost": "#ef4444"
};

const CustodianInventoryAnalyticsSection = () => {
  const [data, setData] = useState<InventoryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
<<<<<<< HEAD
  const [lifecycleView, setLifecycleView] = useState<'timeline' | 'chart'>('chart');
=======
>>>>>>> origin/jesi-branch
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analyticsData = await getInventoryAnalytics();
        console.log('API Response:', analyticsData);

        // Transform the data to get Lost value from API
        const transformedData: InventoryAnalyticsData = {
          ...analyticsData,
          labStatusData: analyticsData.labStatusData.map(lab => {
            console.log('Lab data:', lab);
            console.log('All lab properties:', Object.keys(lab));
            // Get Lost value from lab data (provided by backend per-lab calculation)
            const lostValue = lab.Lost || 0;
            console.log('Lost value for lab', lab.lab_name, ':', lostValue);
            return {
              ...lab,
              Lost: lostValue, // Use Lost count for this specific lab
            };
          }),
          statusDistribution: analyticsData.statusDistribution
        };

        console.log('Transformed data:', transformedData);
        setData(transformedData);
      } catch (err) {
        console.error("Failed to fetch inventory analytics:", err);
        setError("Failed to load inventory analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data for custodian's assigned lab only
  const filteredData = data && user?.lab_id ? {
    ...data,
    labStatusData: data.labStatusData.filter(lab => lab.lab_id === user.lab_id),
    timelineData: data.timelineData?.filter(asset => asset.lab_id === user.lab_id) || [],
    statusDistribution: data.statusDistribution // Keep overall status distribution
  } : data;

  // Calculate timeline summary for custodian's lab
  const timelineSummary = useMemo(() => {
    if (!filteredData?.timelineData) return [];
    
    
    const summary = filteredData.timelineData.reduce((acc, asset) => {
      const labName = asset.lab_name;
      const year = asset.timeline_position;
      
      
      let existingLab = acc.find(item => item.lab === labName);
      if (!existingLab) {
        existingLab = {
          lab: labName,
          year1: 0,
          year2: 0,
          year3: 0,
          year4: 0,
          year5: 0,
          total: 0
        };
        acc.push(existingLab);
      }
      
      // Increment the appropriate year counter (exact year counting logic)
      // timeline_position 0 = Y1 (0-1 years old)
      // timeline_position 1 = Y1 (1 year old)
      // timeline_position 2 = Y2 (2 years old)
      // timeline_position 3 = Y3 (3 years old)
      // timeline_position 4 = Y4 (4 years old)
      // timeline_position 5 = Y5 (5+ years old)
      switch (year) {
        case 0: 
          existingLab.year1++; 
          break;
        case 1: 
          existingLab.year1++; 
          break;
        case 2: 
          existingLab.year2++; 
          break;
        case 3: 
          existingLab.year3++; 
          break;
        case 4: 
          existingLab.year4++; 
          break;
        case 5: 
          existingLab.year5++; 
          break;
        default: 
          break;
      }
      existingLab.total++;
      
      return acc;
    }, [] as Array<{
      lab: string;
      year1: number;
      year2: number;
      year3: number;
      year4: number;
      year5: number;
      total: number;
    }>);
    
    return summary;
  }, [filteredData?.timelineData]);

<<<<<<< HEAD
  const { assetsByWorkstation, filteredWorkstations } = useMemo(() => {
    if (!filteredData?.timelineData) {
      return { assetsByWorkstation: [], filteredWorkstations: [] };
=======
  const { assetsByWorkstation, filteredWorkstations, unassignedAssets } = useMemo(() => {
    if (!filteredData?.timelineData) {
      return { assetsByWorkstation: [], filteredWorkstations: [], unassignedAssets: [] };
>>>>>>> origin/jesi-branch
    }
    
    // Separate actual workstations from "Not Assigned" assets
    const actualWorkstationNames = new Set(
      filteredData.timelineData
        .filter(asset => asset.workstation_name && asset.workstation_name !== 'Not Assigned')
        .map(asset => asset.workstation_name)
    );
    
    // Group actual assets by workstation (excluding placeholders)
    const grouped = filteredData.timelineData
      .filter(asset => asset.asset_id !== 0 && asset.workstation_name && asset.workstation_name !== 'Not Assigned')
      .reduce((acc, asset) => {
        const workstationName = asset.workstation_name;
        
        if (!acc[workstationName]) {
          acc[workstationName] = {
            workstation_name: workstationName,
            assets: []
          };
        }
        
        acc[workstationName].assets.push(asset);
        return acc;
      }, {} as Record<string, {
        workstation_name: string;
        assets: typeof filteredData.timelineData;
      }>);

    // Add all workstations from the timeline data, including those with no assets
    actualWorkstationNames.forEach(workstationName => {
      if (!grouped[workstationName]) {
        grouped[workstationName] = {
          workstation_name: workstationName,
          assets: [] // Empty array for workstations with no assets
        };
      }
    });

    // Get unassigned assets (exclude placeholders)
    const unassigned = filteredData.timelineData
      .filter(asset => asset.asset_id !== 0 && (!asset.workstation_name || asset.workstation_name === 'Not Assigned'));

    // Filter assets by year if a specific year is selected
    const filteredAssetsByWorkstation = Object.values(grouped).map(workstation => {
      if (yearFilter === 'all') {
        return workstation;
      }
      
      const yearPositions: { [key: string]: number[] } = {
        'Y1': [0, 1],
        'Y2': [2],
        'Y3': [3],
        'Y4': [4],
        'Y5': [5]
      };
      
      const positions = yearPositions[yearFilter] || [];
      const filteredAssets = workstation.assets.filter(asset => 
        positions.includes(asset.timeline_position)
      );
      
      return {
        ...workstation,
        assets: filteredAssets
      };
    }).filter(workstation => yearFilter === 'all' ? true : workstation.assets.length > 0); // Only filter out empty workstations when a specific year is selected

    // Filter unassigned assets by year if needed
    let filteredUnassigned = unassigned;
    if (yearFilter !== 'all') {
      const yearPositions: { [key: string]: number[] } = {
        'Y1': [0, 1],
        'Y2': [2],
        'Y3': [3],
        'Y4': [4],
        'Y5': [5]
      };
      
      const positions = yearPositions[yearFilter] || [];
      filteredUnassigned = unassigned.filter(asset => 
        positions.includes(asset.timeline_position)
      );
    }

    // Filter by search term and unassigned filter
    let displayData;
    if (showUnassignedOnly) {
      // Show each unassigned asset as an individual "workstation" with its actual name
      displayData = filteredUnassigned.map(asset => ({
        workstation_name: asset.unit_name || asset.asset_name,
        assets: [asset] // Each asset is shown individually
      })).filter(item => 
        item.workstation_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Show workstations (filter by search term)
      displayData = filteredAssetsByWorkstation.filter(workstation =>
        workstation.workstation_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return { 
      groupedWorkstations: grouped, 
      assetsByWorkstation: Object.values(grouped), 
<<<<<<< HEAD
      filteredWorkstations: displayData
=======
      filteredWorkstations: displayData,
      unassignedAssets: filteredUnassigned
>>>>>>> origin/jesi-branch
    };
  }, [filteredData?.timelineData, searchTerm, yearFilter, showUnassignedOnly]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!filteredData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
<<<<<<< HEAD
          Asset Analytics
        </h2>
        <p className="text-gray-600">
          Track and manage your laboratory assets
=======
          Asset Lifecycle Analytics
        </h2>
        <p className="text-gray-600">
          Track and manage your laboratory asset lifecycle
>>>>>>> origin/jesi-branch
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart with Counts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Asset Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={filteredData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => {
                    const dataItem = filteredData.statusDistribution[entry.index];
                    return `${dataItem.status_name}: ${entry.percent ? (entry.percent * 100).toFixed(1) : '0.0'}%`;
                  }}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {filteredData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.status_name as keyof typeof COLORS] || "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {filteredData.statusDistribution.map((status) => (
                <div key={status.status_name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[status.status_name as keyof typeof COLORS] || "#8884d8" }}
                  />
                  <span className="text-sm text-gray-600">
                    {status.status_name} ({status.count})
                  </span>
                </div>
              ))}
            </div>
            
            {/* Lab Status Summary */}
            {filteredData.labStatusData.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Lab Status Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Assets:</span>
                    <span className="font-medium">{filteredData.labStatusData[0].total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Functional:</span>
                    <span className="font-medium text-green-600">{filteredData.labStatusData[0].Functional}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600">Replace:</span>
                    <span className="font-medium text-yellow-600">{filteredData.labStatusData[0]["For Replacement"]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Repair:</span>
                    <span className="font-medium text-blue-600">{filteredData.labStatusData[0]["For Repair"]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-600">Upgrade:</span>
                    <span className="font-medium text-purple-600">{filteredData.labStatusData[0]["For Upgrade"] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Lost:</span>
                    <span className="font-medium text-red-600">{filteredData.labStatusData[0].Lost || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asset Timelines with Summary */}
        {filteredData.timelineData && filteredData.timelineData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
<<<<<<< HEAD
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Asset Analysis</CardTitle>
                  <button
                    onClick={() => setLifecycleView(lifecycleView === 'timeline' ? 'chart' : 'timeline')}
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {lifecycleView === 'timeline' ? '📊 Chart View' : '📈 Timeline View'}
                  </button>
                </div>
                {lifecycleView === 'timeline' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={showUnassignedOnly ? 'unassigned' : 'workstations'}
                      onChange={(e) => setShowUnassignedOnly(e.target.value === 'unassigned')}
                      className="text-sm border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]"
                    >
                      <option value="workstations">🖥️ Workstations</option>
                      <option value="unassigned">📦 Unassigned</option>
                    </select>
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Years</option>
                      <option value="Y1">Y1 (0-1 years)</option>
                      <option value="Y2">Y2 (2 years)</option>
                      <option value="Y3">Y3 (3 years)</option>
                      <option value="Y4">Y4 (4 years)</option>
                      <option value="Y5">Y5 (5+ years)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Search Filter - Only show in timeline view */}
              {lifecycleView === 'timeline' && (
                <>
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder={showUnassignedOnly ? "Search unassigned assets..." : "Search workstations..."}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-3 py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-64"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      {!showUnassignedOnly && filteredWorkstations.length !== assetsByWorkstation.length && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {filteredWorkstations.length} of {assetsByWorkstation.length} workstations
                        </div>
                      )}
                      {showUnassignedOnly && (
                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          {filteredWorkstations.length} unassigned assets
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    {showUnassignedOnly 
                      ? 'Track unassigned assets that need workstation assignment' 
                      : 'Track asset age by workstation (hover to view all assets)'
                    }
                  </p>
                </>
              )}

              {/* Chart View Description */}
              {lifecycleView === 'chart' && (
                <p className="text-sm text-gray-600 mt-3">
                  Comprehensive asset lifecycle analysis with multiple visualization options
                </p>
              )}
            </CardHeader>
            <CardContent>
              {lifecycleView === 'timeline' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWorkstations
                      .slice(0, 6)
                      .map((workstation: any) => (
                        <WorkstationTimeline
                          key={workstation.workstation_name}
                          workstation_name={workstation.workstation_name}
                          assets={workstation.assets}
                          yearFilter={yearFilter}
                        />
                      ))}
                  </div>
                  
                  {/* Timeline Summary */}
                  {timelineSummary.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Lifecycle Summary</h4>
                      <div className="grid grid-cols-5 gap-3 text-xs">
                        <div className="text-center">
                          <div className="text-blue-600 font-bold">{timelineSummary[0].year1}</div>
                          <div className="text-blue-600 font-bold">Y1</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-600 font-bold">{timelineSummary[0].year2}</div>
                          <div className="text-green-600 font-bold">Y2</div>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-600 font-bold">{timelineSummary[0].year3}</div>
                          <div className="text-yellow-600 font-bold">Y3</div>
                        </div>
                        <div className="text-center">
                          <div className="text-orange-600 font-bold">{timelineSummary[0].year4}</div>
                          <div className="text-orange-600 font-bold">Y4</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-600 font-bold">{timelineSummary[0].year5}</div>
                          <div className="text-red-600 font-bold">Y5</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <AssetLifecycleChart 
                  data={filteredData.timelineData} 
                  title="Asset Lifecycle Distribution"
                />
=======
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle>Asset Lifecycle Timelines</CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={showUnassignedOnly ? 'unassigned' : 'workstations'}
                    onChange={(e) => setShowUnassignedOnly(e.target.value === 'unassigned')}
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]"
                  >
                    <option value="workstations">🖥️ Workstations</option>
                    <option value="unassigned">📦 Unassigned</option>
                  </select>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Years</option>
                    <option value="Y1">Y1 (0-1 years)</option>
                    <option value="Y2">Y2 (2 years)</option>
                    <option value="Y3">Y3 (3 years)</option>
                    <option value="Y4">Y4 (4 years)</option>
                    <option value="Y5">Y5 (5+ years)</option>
                  </select>
                </div>
              </div>

              {/* Search Filter */}
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder={showUnassignedOnly ? "Search unassigned assets..." : "Search workstations..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-64"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  {!showUnassignedOnly && filteredWorkstations.length !== assetsByWorkstation.length && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {filteredWorkstations.length} of {assetsByWorkstation.length} workstations
                    </div>
                  )}
                  {showUnassignedOnly && (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      {filteredWorkstations.length} unassigned assets
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-3">
                {showUnassignedOnly 
                  ? 'Track unassigned assets that need workstation assignment' 
                  : 'Track asset age by workstation (hover to view all assets)'
                }
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkstations
                  .slice(0, 6)
                  .map((workstation: any) => (
                    <WorkstationTimeline
                      key={workstation.workstation_name}
                      workstation_name={workstation.workstation_name}
                      assets={workstation.assets}
                      yearFilter={yearFilter}
                    />
                  ))}
              </div>
              
              {/* Timeline Summary */}
              {timelineSummary.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Lifecycle Summary</h4>
                  <div className="grid grid-cols-5 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-blue-600 font-bold">{timelineSummary[0].year1}</div>
                      <div className="text-blue-600 font-bold">Y1</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-bold">{timelineSummary[0].year2}</div>
                      <div className="text-green-600 font-bold">Y2</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-bold">{timelineSummary[0].year3}</div>
                      <div className="text-yellow-600 font-bold">Y3</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-600 font-bold">{timelineSummary[0].year4}</div>
                      <div className="text-orange-600 font-bold">Y4</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-bold">{timelineSummary[0].year5}</div>
                      <div className="text-red-600 font-bold">Y5</div>
                    </div>
                  </div>
                </div>
>>>>>>> origin/jesi-branch
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustodianInventoryAnalyticsSection;
