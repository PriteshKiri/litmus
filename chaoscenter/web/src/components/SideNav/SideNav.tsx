import React, { ReactElement, useEffect, useState } from 'react';
import cx from 'classnames';
import { NavLink as Link, NavLinkProps } from 'react-router-dom';
import { Text, Layout, Container, TextProps, Popover, Avatar } from '@harnessio/uicore';
import { Icon, IconName } from '@harnessio/icons';
import { Color, FontVariation } from '@harnessio/design-system';
import { Classes, Position, PopoverInteractionKind } from '@blueprintjs/core';
import { useLogout, useRouteWithBaseUrl } from '@hooks';
import { useStrings } from '@strings';
import { useAppStore } from '@context';
import ProjectSelectorController from '@controllers/ProjectSelector';
import NavExpandable from '@components/NavExpandable';
import { getUserDetails } from '@utils';
import { PermissionGroup } from '@models';
import litmusLogoSmall from '@images/litmus-logo-small.svg';
import css from './SideNav.module.scss';

interface SidebarLinkProps extends NavLinkProps {
  label: string;
  icon?: IconName;
  className?: string;
  textProps?: TextProps;
}

const SideNavCollapseButton: React.FC<{ isExpanded: boolean; onClick: () => void }> = ({ isExpanded, onClick }) => {
  return (
    <Container
      className={cx(css.sideNavResizeBtn, {
        [css.collapse]: isExpanded,
        [css.expand]: !isExpanded
      })}
      onMouseEnter={e => e.stopPropagation()}
      onMouseLeave={e => e.stopPropagation()}
      onClick={onClick}
    >
      <Popover
        content={
          <Text color={Color.WHITE} padding="small">
            {isExpanded ? 'collapse' : 'expand'}
          </Text>
        }
        portalClassName={css.popover}
        popoverClassName={Classes.DARK}
        interactionKind={PopoverInteractionKind.HOVER}
        position={Position.LEFT}
      >
        <Icon className={css.triangle} name="symbol-triangle-up" size={12} />
      </Popover>
    </Container>
  );
};

export const SidebarLink: React.FC<SidebarLinkProps> = ({ label, icon, className, textProps, ...others }) => (
  <Link className={cx(css.link, className)} activeClassName={css.selected} {...others}>
    <Text icon={icon} className={css.text} {...textProps}>
      {label}
    </Text>
  </Link>
);

export const SIDE_NAV_EXPAND_TIMER = 500;

const LitmusLogoSection: React.FC = () => {
  const projectScopedPaths = useRouteWithBaseUrl();
  const { getString } = useStrings();

  return (
    <Link className={cx(css.logoLink)} to={projectScopedPaths.toDashboard}>
      <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'flex-start' }} spacing="small" padding="medium">
        <img src={litmusLogoSmall} alt="Litmus Logo" width={30} height={30} />
        <Text font={{ weight: 'semi-bold', align: 'center' }} color={Color.WHITE} className={css.logoText}>
          {getString('litmus')}
        </Text>
      </Layout.Horizontal>
    </Link>
  );
};

const AccountSection: React.FC = () => {
  const accountScopedPaths = useRouteWithBaseUrl('account');
  const { currentUserInfo } = useAppStore();

  return (
    <Link className={cx(css.accountLink)} to={accountScopedPaths.toAccountSettingsOverview}>
      <Layout.Vertical flex spacing="xsmall" padding="medium">
        <Avatar
          name={currentUserInfo?.fullName?.split(' ')[0] ?? currentUserInfo?.username}
          email={currentUserInfo?.email}
          size="small"
          hoverCard={false}
        />
        <Text font={{ variation: FontVariation.TINY }} color={Color.WHITE} lineClamp={1}>
          {(currentUserInfo?.fullName ?? currentUserInfo?.username)?.toUpperCase()}
        </Text>
      </Layout.Vertical>
    </Link>
  );
};

export default function SideNav(): ReactElement {
  const { getString } = useStrings();
  const paths = useRouteWithBaseUrl();
  const { forceLogout } = useLogout();
  const { projectRole } = getUserDetails();
  const accountScopedPaths = useRouteWithBaseUrl('account');
  const collapseByDefault = false;
  const [sideNavHovered, setSideNavhovered] = useState<boolean>(false);
  const [sideNavExpanded, setSideNavExpanded] = useState<boolean>(!collapseByDefault);

  useEffect(() => {
    const timer =
      sideNavHovered &&
      setTimeout(() => {
        setSideNavExpanded(true);
      }, SIDE_NAV_EXPAND_TIMER);

    return () => {
      timer && clearTimeout(timer);
    };
  }, [sideNavHovered]);

  const isPathPresent = (path: string): boolean => {
    return window.location.pathname.includes(path);
  };

  return (
    <div
      className={cx(css.main, {
        [css.sideNavExpanded]: sideNavExpanded,
        [css.newNav]: true
      })}
      onMouseEnter={() => {
        /* istanbul ignore next */
        !sideNavExpanded && setSideNavhovered(true);
      }}
      onMouseLeave={() => {
        /* istanbul ignore next */
        !sideNavExpanded && setSideNavhovered(false);
      }}
    >
      {/* Logo Section at Top */}
      <div className={css.logoSection}>
        <LitmusLogoSection />
      </div>

      {/* Main Navigation */}
      <div className={css.mainNavSection}>
        {isPathPresent('settings') || isPathPresent('projects') ? (
          <Layout.Vertical spacing="small" padding={{ top: 'large' }}>
            <SidebarLink label={getString('settings')} to={accountScopedPaths.toAccountSettingsOverview()} />
            <SidebarLink label={getString('projects')} to={accountScopedPaths.toProjects()} />
          </Layout.Vertical>
        ) : (
          <Layout.Vertical spacing="small">
            <ProjectSelectorController />
            <SidebarLink label={getString('overview')} to={paths.toDashboard()} />
            <SidebarLink label={getString('chaosExperiments')} to={paths.toExperiments()} />
            <SidebarLink label={getString('environments')} to={paths.toEnvironments()} />
            <SidebarLink label={getString('resilienceProbes')} to={paths.toChaosProbes()} />
            <SidebarLink label={getString('chaoshubs')} to={paths.toChaosHubs()} />
            {projectRole === PermissionGroup.OWNER && (
              <NavExpandable title={getString('projectSetup')} route={paths.toProjectSetup()}>
                <SidebarLink label={getString('members')} to={paths.toProjectMembers()} />
                <SidebarLink label={getString('gitops')} to={paths.toGitops()} />
                <SidebarLink label={getString('imageRegistry')} to={paths.toImageRegistry()} />
              </NavExpandable>
            )}
          </Layout.Vertical>
        )}
      </div>
      {/* Bottom Section with Account and Sign Out */}
      <Container className={css.bottomContainer} data-isroutepresent={isPathPresent('settings')}>
        {!isPathPresent('settings') && (
          <div className={css.accountSection}>
            <AccountSection />
          </div>
        )}
        <div className={css.titleContainer}>
          {isPathPresent('settings') ? (
            <Layout.Horizontal
              flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
              className={css.logOutContainer}
              onClick={forceLogout}
            >
              <Icon name="log-out" color={Color.WHITE} />
              <Text font={{ variation: FontVariation.BODY }} color={Color.WHITE}>
                Sign Out
              </Text>
            </Layout.Horizontal>
          ) : (
            <Layout.Vertical>
              <Text color={Color.WHITE} className={css.title}>
                {getString('litmus')} 3.0
              </Text>
            </Layout.Vertical>
          )}
        </div>
      </Container>

      <SideNavCollapseButton
        isExpanded={sideNavExpanded}
        onClick={() => {
          setSideNavExpanded(!sideNavExpanded);
        }}
      />
    </div>
  );
}
