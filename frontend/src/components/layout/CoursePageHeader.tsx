import type { ReactNode } from 'react';
import { Typography } from 'antd';

interface CoursePageHeaderProps {
  title: string;
  description?: string;
  badges?: ReactNode;
  actions?: ReactNode;
}

/** 课程内页统一页头：标题、描述、标签、操作区 */
export default function CoursePageHeader({
  title, description, badges, actions,
}: CoursePageHeaderProps) {
  return (
    <header className="course-page-header">
      <div className="course-page-header__main">
        <Typography.Title level={2} className="course-page-header__title">
          {title}
        </Typography.Title>
        {description && (
          <Typography.Text className="course-page-header__desc">{description}</Typography.Text>
        )}
      </div>
      {(badges || actions) && (
        <div className="course-page-header__aside">
          {badges && <div className="course-page-header__badges">{badges}</div>}
          {actions && <div className="course-page-header__actions">{actions}</div>}
        </div>
      )}
    </header>
  );
}
