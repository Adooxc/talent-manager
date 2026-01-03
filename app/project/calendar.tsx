import { useCallback, useState, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Project, ProjectStatus } from "@/lib/types";
import { getProjects, getCurrencySymbol } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: "#9CA3AF",
  negotiating: "#F59E0B",
  active: "#3B82F6",
  completed: "#22C55E",
  postponed: "#8B5CF6",
  cancelled: "#EF4444",
};

export default function ProjectCalendarScreen() {
  const router = useRouter();
  const colors = useColors();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    const data = await getProjects();
    setProjects(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects])
  );

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days: { date: string; day: number; isCurrentMonth: boolean; projects: Project[] }[] = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day).toISOString().split('T')[0];
      days.push({ date, day, isCurrentMonth: false, projects: [] });
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day).toISOString().split('T')[0];
      const dayProjects = projects.filter(p => {
        const start = p.startDate.split('T')[0];
        const end = p.endDate.split('T')[0];
        return date >= start && date <= end;
      });
      days.push({ date, day, isCurrentMonth: true, projects: dayProjects });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day).toISOString().split('T')[0];
      days.push({ date, day, isCurrentMonth: false, projects: [] });
    }
    
    return days;
  }, [currentDate, projects]);

  const selectedDateProjects = useMemo(() => {
    if (!selectedDate) return [];
    return projects.filter(p => {
      const start = p.startDate.split('T')[0];
      const end = p.endDate.split('T')[0];
      return selectedDate >= start && selectedDate <= end;
    });
  }, [selectedDate, projects]);

  const goToPrevMonth = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Project Calendar</Text>
        <TouchableOpacity
          onPress={goToToday}
          style={[styles.todayButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Month Navigation */}
      <View style={[styles.monthNav, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.foreground }]}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <IconSymbol name="chevron.right" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={[styles.dayHeaderText, { color: colors.muted }]}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarData.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedDate(item.date)}
            style={[
              styles.dayCell,
              { borderColor: colors.border },
              selectedDate === item.date && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
              item.date === today && { borderColor: colors.primary, borderWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.dayNumber,
                { color: item.isCurrentMonth ? colors.foreground : colors.muted },
                selectedDate === item.date && { color: colors.primary, fontWeight: '700' },
              ]}
            >
              {item.day}
            </Text>
            {item.projects.length > 0 && (
              <View style={styles.projectDots}>
                {item.projects.slice(0, 3).map((p, i) => (
                  <View
                    key={i}
                    style={[styles.projectDot, { backgroundColor: STATUS_COLORS[p.status] }]}
                  />
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Date Projects */}
      {selectedDate && (
        <View style={[styles.selectedSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.selectedTitle, { color: colors.foreground }]}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          {selectedDateProjects.length === 0 ? (
            <Text style={[styles.noProjects, { color: colors.muted }]}>No projects on this date</Text>
          ) : (
            <FlatList
              data={selectedDateProjects}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/project/${item.id}` as any)}
                  style={[styles.projectCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <View style={[styles.statusBar, { backgroundColor: STATUS_COLORS[item.status] }]} />
                  <Text style={[styles.projectName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.projectDate, { color: colors.muted }]}>
                    {new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  dayHeaders: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 14,
  },
  projectDots: {
    flexDirection: "row",
    marginTop: 4,
    gap: 2,
  },
  projectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selectedSection: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  noProjects: {
    fontSize: 14,
  },
  projectCard: {
    width: 160,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  statusBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  projectName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  projectDate: {
    fontSize: 12,
  },
});
