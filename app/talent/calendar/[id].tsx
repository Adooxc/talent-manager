import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { TalentBooking, Talent } from "@/lib/types";
import { 
  getTalentById, 
  getBookingsByTalentId, 
  saveBooking, 
  updateBooking, 
  deleteBooking 
} from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function TalentCalendarScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  
  const [talent, setTalent] = useState<Talent | null>(null);
  const [bookings, setBookings] = useState<TalentBooking[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<TalentBooking | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    const [talentData, bookingsData] = await Promise.all([
      getTalentById(id),
      getBookingsByTalentId(id),
    ]);
    setTalent(talentData);
    setBookings(bookingsData.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    ));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const resetForm = () => {
    setTitle("");
    setLocation("");
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setStartTime("09:00");
    setEndDate(today);
    setEndTime("17:00");
    setAllDay(false);
    setNotes("");
  };

  const openAddModal = () => {
    setEditingBooking(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (booking: TalentBooking) => {
    setEditingBooking(booking);
    setTitle(booking.title);
    setLocation(booking.location || "");
    setStartDate(booking.startDate.split("T")[0]);
    setStartTime(booking.startDate.split("T")[1]?.substring(0, 5) || "09:00");
    setEndDate(booking.endDate.split("T")[0]);
    setEndTime(booking.endDate.split("T")[1]?.substring(0, 5) || "17:00");
    setAllDay(booking.allDay);
    setNotes(booking.notes || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter an event title");
      return;
    }

    if (!startDate) {
      Alert.alert("Error", "Please enter a start date");
      return;
    }

    setSaving(true);
    try {
      const startDateTime = allDay 
        ? `${startDate}T00:00:00` 
        : `${startDate}T${startTime || "00:00"}:00`;
      const endDateTime = allDay 
        ? `${endDate || startDate}T23:59:59` 
        : `${endDate || startDate}T${endTime || startTime || "23:59"}:00`;

      if (editingBooking) {
        await updateBooking(editingBooking.id, {
          title: title.trim(),
          location: location.trim() || undefined,
          startDate: startDateTime,
          endDate: endDateTime,
          allDay,
          notes: notes.trim() || undefined,
        });
      } else {
        await saveBooking({
          talentId: id!,
          title: title.trim(),
          location: location.trim() || undefined,
          startDate: startDateTime,
          endDate: endDateTime,
          allDay,
          notes: notes.trim() || undefined,
        });
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to save booking");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (booking: TalentBooking) => {
    Alert.alert(
      "Delete Booking",
      `Are you sure you want to delete "${booking.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteBooking(booking.id);
            loadData();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const upcomingBookings = bookings.filter(b => isUpcoming(b.endDate));
  const pastBookings = bookings.filter(b => !isUpcoming(b.endDate));

  const renderBookingCard = (booking: TalentBooking, isPast: boolean) => (
    <TouchableOpacity
      key={booking.id}
      onPress={() => openEditModal(booking)}
      style={[
        styles.bookingCard,
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          opacity: isPast ? 0.6 : 1,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={[styles.dateStrip, { backgroundColor: isPast ? colors.muted : colors.primary }]}>
        <Text style={styles.dateStripDay}>
          {new Date(booking.startDate).getDate()}
        </Text>
        <Text style={styles.dateStripMonth}>
          {new Date(booking.startDate).toLocaleDateString("en-US", { month: "short" })}
        </Text>
      </View>
      <View style={styles.bookingContent}>
        <Text style={[styles.bookingTitle, { color: colors.foreground }]}>{booking.title}</Text>
        {booking.location && (
          <View style={styles.bookingRow}>
            <IconSymbol name="mappin" size={14} color={colors.muted} />
            <Text style={[styles.bookingLocation, { color: colors.muted }]}>{booking.location}</Text>
          </View>
        )}
        <View style={styles.bookingRow}>
          <IconSymbol name="clock.fill" size={14} color={colors.muted} />
          <Text style={[styles.bookingTime, { color: colors.muted }]}>
            {booking.allDay 
              ? "All Day" 
              : `${formatTime(booking.startDate)} - ${formatTime(booking.endDate)}`}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => handleDelete(booking)} 
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <IconSymbol name="trash.fill" size={18} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {talent?.name || "Calendar"}
        </Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Upcoming ({upcomingBookings.length})
          </Text>
          {upcomingBookings.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="calendar" size={32} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No upcoming bookings</Text>
            </View>
          ) : (
            upcomingBookings.map(b => renderBookingCard(b, false))
          )}
        </View>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>
              Past ({pastBookings.length})
            </Text>
            {pastBookings.map(b => renderBookingCard(b, true))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingBooking ? "Edit Booking" : "Add Booking"}
              </Text>
              <TouchableOpacity onPress={handleSave} disabled={saving}>
                <Text style={[styles.modalSave, { color: colors.primary, opacity: saving ? 0.5 : 1 }]}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Event Title *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Photo Shoot, Meeting"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Location</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g., Studio A, Client Office"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.label, { color: colors.foreground }]}>All Day</Text>
                <Switch
                  value={allDay}
                  onValueChange={setAllDay}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Start Date *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.muted}
                    returnKeyType="done"
                  />
                </View>
                {!allDay && (
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.label, { color: colors.foreground }]}>Start Time</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.muted}
                      returnKeyType="done"
                    />
                  </View>
                )}
              </View>

              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.foreground }]}>End Date</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.muted}
                    returnKeyType="done"
                  />
                </View>
                {!allDay && (
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.label, { color: colors.foreground }]}>End Time</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.muted}
                      returnKeyType="done"
                    />
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional notes..."
                  placeholderTextColor={colors.muted}
                  multiline
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backText: {
    fontSize: 17,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 2,
    textAlign: "center",
  },
  addButton: {
    flex: 1,
    alignItems: "flex-end",
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  bookingCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  dateStrip: {
    width: 60,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dateStripDay: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
  },
  dateStripMonth: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  bookingContent: {
    flex: 1,
    padding: 12,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  bookingLocation: {
    fontSize: 13,
  },
  bookingTime: {
    fontSize: 13,
  },
  deleteButton: {
    padding: 16,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 17,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalSave: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
});
