import Session from "../models/Session.ts";
import Therapist from "../models/Therapist.ts";
import User from "../models/User.ts";
import type { IServiceResponse, ISession, ISessionServices, ITherapist } from "../types/interfaces.ts";

export class SessionServices implements ISessionServices {
    async getAvailableSlots(therapistId: string, date: Date): Promise<IServiceResponse> {
        try {
            const therapist = await Therapist.findOne({ userId: therapistId }).lean();
            if (!therapist) {
                return {
                    success: false,
                    message: "Therapist not found",
                    content: {}
                };
            }

            // Check if therapist is off on this date
            const isOff = therapist.daysOff.some(dayOff => 
                dayOff.toDateString() === date.toDateString()
            );
            
            if (isOff) {
                return {
                    success: true,
                    message: "No slots available - therapist is off",
                    content: { availableSlots: [] }
                };
            }

            // Get day of week working hours
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[date.getDay()] as keyof typeof therapist.workingHours;
            const workingHours = therapist.workingHours[dayName];
            
            if (!workingHours) {
                return {
                    success: true,
                    message: "No working hours set for this day",
                    content: { availableSlots: [] }
                };
            }

            // Get existing bookings for this date
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const existingSessions = await Session.find({
                therapistId,
                dateTime: { $gte: startOfDay, $lte: endOfDay },
                success: { $nin: ['cancelled'] } // Exclude cancelled sessions
            }).lean();

            // Generate available slots
            const availableSlots = this.generateAvailableSlots(
                workingHours.start,
                workingHours.end,
                existingSessions,
                date
            );

            return {
                success: true,
                message: "Available slots retrieved successfully",
                content: { availableSlots }
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to get available slots",
                content: {}
            };
        }
    }

    async postSession(patientId: string, payload: ISession): Promise<IServiceResponse> {
        try {
            const sessionDate = new Date(payload.dateTime);
            const slotsResponse = await this.getAvailableSlots(payload.therapistId, sessionDate);
            if (!slotsResponse.success) {
                return slotsResponse;
            }

            const availableSlots = (slotsResponse.content as any).availableSlots;
            const requestedTime = sessionDate.toISOString();

            const isSlotAvailable = availableSlots.some((slot: any) =>
                new Date(slot.start).toISOString() === requestedTime
            );


            if (!isSlotAvailable) {
                return {
                    success: false,
                    message: "Selected time slot is not available",
                    content: {}
                };
            }

            // Create session
            const session = new Session({
                ...payload,
                patientId,
                success: 'pending',
                bookingTime: new Date()
            });

            const savedSession = await session.save();

            return {
                success: true,
                message: "Session booked successfully",
                content: savedSession
            };

        } catch (error: any) {
            console.error(error);
            if (error.code === 11000) {
                return {
                    success: false,
                    message: "Time slot already booked",
                    content: {}
                };
            }
            return {
                success: false,
                message: error.message || "Failed to book session",
                content: {}
            };
        }
    }

    async cancelSession(sessionId: string, cancellationReason?: string): Promise<IServiceResponse> {
        try {
            const session = await Session.findByIdAndUpdate(
                sessionId,
                { 
                    success: 'cancelled',
                    cancellationReason: cancellationReason || 'No reason provided'
                },
                { new: true }
            );

            if (!session) {
                return {
                    success: false,
                    message: "Session not found",
                    content: {}
                };
            }

            return {
                success: true,
                message: "Session cancelled successfully. Time slot is now available.",
                content: session
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to cancel session",
                content: {}
            };
        }
    }

    async getAllSessions(userId?: string): Promise<IServiceResponse> {
        try {
            let sessions = [];
            if(userId) {
                sessions = await Session.find({
                    $or: [
                        {'patientId': userId},
                        {'therapistId': userId}
                    ]
                })
                .populate('patientId', 'name')
                .populate('therapistId', 'name')
                .sort({ dateTime: -1 })
                .lean();
            } else {
                sessions = await Session.find()
                .populate('patientId', 'name')
                .populate('therapistId', 'name')
                .sort({ dateTime: -1 })
                .lean();
            }
            

            return {
                success: true,
                message: "Sessions retrieved successfully",
                content: sessions
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to get sessions",
                content: {}
            };
        }
    }

    async getSession(id: string): Promise<IServiceResponse> {
        try {
            const session = await Session.findById(id)
                .populate('patientId', 'name photoUrl')
                .populate('therapistId', 'name photoUrl')
                .lean();

            if (!session) {
                return {
                    success: false,
                    message: "Session not found",
                    content: {}
                };
            }

            return {
                success: true,
                message: "Session retrieved successfully",
                content: session
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to get session",
                content: {}
            };
        }
    }

    async updateSession(id: string, payload: Partial<ISession>): Promise<IServiceResponse> {
        try {
            const session = await Session.findByIdAndUpdate(
                id,
                payload,
                { new: true }
            ).lean();

            if (!session) {
                return {
                    success: false,
                    message: "Session not found",
                    content: {}
                };
            }

            return {
                success: true,
                message: "Session updated successfully",
                content: session
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to update session",
                content: {}
            };
        }
    }

    async deleteSession(id: string): Promise<IServiceResponse> {
        try {
            const session = await Session.findByIdAndDelete(id);

            if (!session) {
                return {
                    success: false,
                    message: "Session not found",
                    content: {}
                };
            }

            return {
                success: true,
                message: "Session deleted successfully",
                content: {}
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to delete session",
                content: {}
            };
        }
    }

    private generateAvailableSlots(
        startTime: string,
        endTime: string,
        existingSessions: any[],
        date: Date
    ): { start: Date; end: Date }[] {
        const slots: { start: Date; end: Date }[] = [];
        const slotDuration = 60;
        
        const timeNumbers = startTime.split(':').map(Number);
        const endTimeNumbers = endTime.split(':').map(Number);
        
        const startHour = timeNumbers[0] || 0;
        const startMin = timeNumbers[1] || 0;
        const endHour = endTimeNumbers[0] || 0;
        const endMin = endTimeNumbers[1] || 0;
        
        if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
            return [];
        }
        
        const startDate = new Date(date);
        startDate.setHours(startHour, startMin, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(endHour, endMin, 0, 0);
        
        let currentSlot = new Date(startDate);
        
        while (currentSlot < endDate) {
            const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60 * 1000);
            
            // Check if this slot conflicts with existing sessions
            const hasConflict = existingSessions.some(session => {
                const sessionStart = new Date(session.dateTime);
                const sessionEnd = new Date(sessionStart.getTime() + (session.duration || 60) * 60 * 1000);
                
                return (currentSlot >= sessionStart && currentSlot < sessionEnd) ||
                       (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
                       (currentSlot <= sessionStart && slotEnd >= sessionEnd);
            });
            
            if (!hasConflict && slotEnd <= endDate) {
                slots.push({
                    start: new Date(currentSlot),
                    end: new Date(slotEnd)
                });
            }
            
            currentSlot = new Date(currentSlot.getTime() + slotDuration * 60 * 1000);
        }
        
        return slots;
    }
}

export const sessionServices = new SessionServices();