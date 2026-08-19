package com.example.smartteachingplatform.notification.mapper;

import com.example.smartteachingplatform.notification.entity.Notification;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface NotificationMapper {

    /** 插入通知（返回自增 ID） */
    @Insert("INSERT INTO notifications (receiver_id, course_id, notification_type, title, content, is_read, created_at) " +
            "VALUES (#{receiverId}, #{courseId}, #{notificationType}, #{title}, #{content}, #{isRead}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Notification notification);

    /** 分页查询通知列表 */
    @Select("SELECT * FROM notifications WHERE receiver_id = #{receiverId} " +
            "AND is_read = #{isRead} " +
            "ORDER BY created_at DESC LIMIT #{size} OFFSET #{offset}")
    List<Notification> findByReceiver(@Param("receiverId") Long receiverId,
                                      @Param("isRead") int isRead,
                                      @Param("offset") int offset,
                                      @Param("size") int size);

    /** 查询全部通知（不分已读未读） */
    @Select("SELECT * FROM notifications WHERE receiver_id = #{receiverId} " +
            "ORDER BY created_at DESC LIMIT #{size} OFFSET #{offset}")
    List<Notification> findByReceiverAll(@Param("receiverId") Long receiverId,
                                         @Param("offset") int offset,
                                         @Param("size") int size);

    /** 未读数量 */
    @Select("SELECT COUNT(*) FROM notifications WHERE receiver_id = #{receiverId} AND is_read = 0")
    int countUnread(@Param("receiverId") Long receiverId);

    /** 单条已读 */
    @Update("UPDATE notifications SET is_read = 1 WHERE id = #{id} AND receiver_id = #{receiverId}")
    int markRead(@Param("id") Long id, @Param("receiverId") Long receiverId);

    /** 全部已读 */
    @Update("UPDATE notifications SET is_read = 1 WHERE receiver_id = #{receiverId} AND is_read = 0")
    int markAllRead(@Param("receiverId") Long receiverId);

    /** 按 ID 查询 */
    @Select("SELECT * FROM notifications WHERE id = #{id}")
    Notification findById(@Param("id") Long id);

    /** 按课程ID删除所有通知（供种子数据幂等清理） */
    @Delete("DELETE FROM notifications WHERE course_id = #{courseId}")
    int deleteByCourseId(@Param("courseId") Long courseId);
}
